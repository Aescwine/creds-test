/* eslint-disable no-console */
import fs from "fs/promises";
import path from "path";
import { PrismaClient, Prisma } from "@prisma/client";
import { createKnowledgeAsset } from "@/lib/dkg";
import { ipfsAddBytes } from "@/lib/ipfs";

const prisma = new PrismaClient();

/* ------------------------ config ------------------------ */

const LOOP_IDLE_MS = Number(process.env.WORKER_IDLE_MS ?? 1500);
const LOOP_MAX_JOBS_PER_TICK = Number(process.env.WORKER_MAX_JOBS_PER_TICK ?? 1); // bump if you want light parallelism

/* ------------------------ helpers ------------------------ */

function backoffSec(attempts: number) {
    const base = Math.min(300, 2 ** attempts); // cap ~5 minutes
    const jitter = Math.floor(Math.random() * 10);
    return base + jitter;
}

/** Atomically claim the next available job (QUEUED & due), mark RUNNING, bump attempts. */
async function claimNextJob() {
    const now = new Date();
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const j = await tx.job.findFirst({
            where: { status: "QUEUED", scheduledAt: { lte: now } },
            orderBy: [{ scheduledAt: "asc" }, { createdAt: "asc" }],
        });
        if (!j) return null;

        const changed = await tx.job.updateMany({
            where: { id: j.id, status: "QUEUED" },
            data: { status: "RUNNING", startedAt: new Date(), attempts: { increment: 1 } },
        });
        if (changed.count === 0) return null;

        return tx.job.findUnique({ where: { id: j.id } });
    });
}

async function finishOK(id: string) {
    await prisma.job.update({
        where: { id },
        data: { status: "DONE", finishedAt: new Date(), error: null },
    });
}

async function reschedule(id: string, attempts: number, err: string, maxAttempts: number) {
    const giveUp = attempts >= maxAttempts;
    await prisma.job.update({
        where: { id },
        data: {
            status: giveUp ? "FAILED" : "QUEUED",
            error: err.slice(0, 1000),
            finishedAt: giveUp ? new Date() : null,
            scheduledAt: giveUp ? undefined : new Date(Date.now() + backoffSec(attempts) * 1000),
        },
    });
}

/* ------------------------ processors ------------------------ */

async function processCreateUserKA(job: any) {
    const userId = job.subjectId as string | undefined;
    if (!userId) throw new Error("Missing userId in payload");

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User not found");

    if (user.userUAL) {
        await prisma.user.update({ where: { id: userId }, data: { kaPending: false, kaError: null } });
        return;
    }

    const content = job.payload as any;
    const result = await createKnowledgeAsset(content);

    await prisma.user.update({
        where: { id: userId },
        data: { userUAL: result.UAL, kaPending: false, kaError: null },
    });

    console.log("[worker] KA created", { jobId: job.id, userId, ual: result.UAL });
}

/** Pin ORIGINAL file to IPFS (Kubo) and record CID/URI. */
async function processPinAssetToIPFS(job: any) {
    const assetId = job.subjectId as string | undefined;
    if (!assetId) throw new Error("Missing assetId in payload");

    const [asset, original] = await Promise.all([
        prisma.asset.findUnique({ where: { id: assetId }, select: { id: true, ipfsCid: true, status: true } }),
        prisma.file.findFirst({ where: { assetId, variant: "ORIGINAL" }, select: { url: true, mime: true } }),
    ]);

    if (!asset) throw new Error("Asset not found");
    if (asset.ipfsCid) return; // already pinned
    if (!original?.url) throw new Error("Original file missing");

    const diskPath = path.join(process.cwd(), "public", original.url.replace(/^\//, ""));
    const filename = path.basename(diskPath);
    const data = await fs.readFile(diskPath);

    const { cid, uri } = await ipfsAddBytes(new Uint8Array(data), { filename });

    await prisma.$transaction([
        prisma.asset.update({ where: { id: assetId }, data: { ipfsCid: cid, status: "PUBLISHED" } }),
        prisma.file.upsert({
            where: { assetId_variant: { assetId, variant: "CREDENTIALED" } }, // adjust if you use a different variant
            create: { assetId, variant: "CREDENTIALED", url: uri, mime: original.mime },
            update: { url: uri },
        }),
    ]);

    console.log("[worker] IPFS pinned", { jobId: job.id, assetId, cid, uri });
}

/* ------------------------ main loop ------------------------ */

async function processOne() {
    const job = await claimNextJob();
    if (!job) return false;

    const label = `${job.type}#${job.id}`;
    const attempt = job.attempts; // already incremented on claim

    try {
        switch (job.type) {
            case "CreateUserKA":
                await processCreateUserKA(job);
                break;
            case "PinAssetToIPFS":
                await processPinAssetToIPFS(job);
                break;
            default:
                throw new Error(`Unknown job type: ${job.type}`);
        }
        await finishOK(job.id);
        console.log("[worker] done", { job: label, attempt });
    } catch (e: any) {
        const msg = e?.message ?? String(e);
        await reschedule(job.id, attempt, msg, job.maxAttempts);
        console.warn("[worker] failed", { job: label, attempt, msg });
    }
    return true;
}

/* ------------------------ lifecycle ------------------------ */

let shuttingDown = false;

async function bootstrap() {
    console.log("[worker] starting…");

    // Recover RUNNING jobs from a previous crash
    const recovered = await prisma.job.updateMany({
        where: { status: "RUNNING" },
        data: { status: "QUEUED", startedAt: null },
    });
    if (recovered.count > 0) {
        console.log("[worker] recovered jobs", { count: recovered.count });
    }

    // basic env hints
    if (process.env.IPFS_ENDPOINT) {
        console.log("[worker] IPFS endpoint:", process.env.IPFS_ENDPOINT);
    }
}

function setupSignals() {
    const stop = async (signal: string) => {
        if (shuttingDown) return;
        shuttingDown = true;
        console.log(`[worker] ${signal} received, shutting down…`);
        try {
            await prisma.$disconnect();
        } finally {
            process.exit(0);
        }
    };
    process.on("SIGINT", () => void stop("SIGINT"));
    process.on("SIGTERM", () => void stop("SIGTERM"));
}

async function main() {
    await bootstrap();
    setupSignals();

    while (!shuttingDown) {
        let ran = 0;
        // process up to N jobs per tick if desired
        while (!shuttingDown && ran < LOOP_MAX_JOBS_PER_TICK) {
            const worked = await processOne();
            if (!worked) break;
            ran++;
        }
        if (ran === 0) {
            await new Promise((r) => setTimeout(r, LOOP_IDLE_MS));
        }
    }
}

// Fire it up
main().catch(async (e) => {
    console.error("[worker] fatal", e);
    try { await prisma.$disconnect(); } catch { }
    process.exit(1);
});
