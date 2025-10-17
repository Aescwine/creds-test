import { prisma } from "@/lib/db";

export async function enqueueCreateUserKA(userId: string) {
    // Avoid duplicates: only one active job per user
    const existing = await prisma.job.findFirst({
        where: {
            type: "CreateUserKA",
            status: { in: ["QUEUED", "RUNNING"] as any },
            subjectId: userId,
        },
        select: { id: true },
    });

    if (!existing) {
        await prisma.job.create({
            data: {
                type: "CreateUserKA",
                subjectId: userId,
                payload: {},
                status: "QUEUED",
                maxAttempts: 5,
            },
        });
    }

    await prisma.user.update({
        where: { id: userId },
        data: { kaPending: true, kaQueuedAt: new Date(), kaError: null },
    });
}

export async function enqueuePinAssetToIPFS(assetId: string) {
    // dedupe: any queued/running job for this asset?
    const existing = await prisma.job.findFirst({
        where: {
            type: "PinAssetToIPFS",
            subjectId: assetId,
            status: { in: ["QUEUED", "RUNNING"] }
        },
        select: { id: true },
    });

    if (existing) return existing;

    return prisma.job.create({
        data: {
            type: "PinAssetToIPFS",
            subjectId: assetId,
            payload: {},
            status: "QUEUED",
            maxAttempts: 5,
        },
    });
}

export async function enqueuePublishAssetKA(assetId: string, parentJobId?: string) {
    // idempotency: avoid duplicate queued/running publish jobs for same asset
    const existing = await prisma.job.findFirst({
        where: {
            type: "PublishAssetKA",
            subjectId: assetId,
            status: { in: ["QUEUED", "RUNNING"] as any }
        },
        select: { id: true },
    });
    if (existing) return existing;

    return prisma.job.create({
        data: {
            type: "PublishAssetKA",
            subjectId: assetId,
            status: "QUEUED",
            payload: {},
            parentJobId,
            maxAttempts: 5,
        },
    });
}
