// app/api/assets/upload/route.ts
import { NextResponse } from "next/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { saveFile } from "@/lib/storage";
import { enqueuePinAssetToIPFS } from "@/lib/jobs";
import { enqueuePublishAssetKA } from "@/lib/jobs";
import sharp from "sharp";
import crypto from "crypto";
import path from "path";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 20 * 1024 * 1024;   // 20 MB hard cap
const MAX_DIM = 12000;                 // refuse absurdly large images

type AnyFile = Blob & { name?: string; type?: string; size?: number };

export async function POST(req: Request) {
    // --- Auth ---
    const session = await auth();
    const userId = (session?.user as any)?.id as string | undefined;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Optional: quick preflight by Content-Length header (best-effort)
    const lenHeader = req.headers.get("content-length");
    if (lenHeader && Number(lenHeader) > MAX_BYTES + 1024 * 10) {
        return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }

    // --- Parse form ---
    const form = await req.formData();
    const file = form.get("file") as AnyFile | null;
    const title = (form.get("title") as string) || undefined;

    if (!file || typeof (file as any).arrayBuffer !== "function") {
        return NextResponse.json({ error: "Missing or invalid file" }, { status: 400 });
    }

    // Read once
    const buf = Buffer.from(await file.arrayBuffer());
    const mime = file.type ?? "application/octet-stream";
    const size = typeof file.size === "number" ? file.size : buf.length;
    const filename = file.name ?? "upload.bin";

    // --- Validation ---
    if (!ALLOWED.has(mime)) {
        return NextResponse.json({ error: `Unsupported type ${mime}` }, { status: 415 });
    }
    if (size > MAX_BYTES) {
        return NextResponse.json({ error: "File too large" }, { status: 413 });
    }

    // Try decoding with sharp (also gives us dimensions). This guards against spoofed MIME.
    let image = sharp(buf, { failOn: "error" });
    try {
        const meta = await image.metadata();
        if (!meta.width || !meta.height) throw new Error("not-an-image");
        if (meta.width > MAX_DIM || meta.height > MAX_DIM) {
            return NextResponse.json({ error: "Image dimensions too large" }, { status: 422 });
        }
    } catch {
        return NextResponse.json({ error: "Invalid image data" }, { status: 422 });
    }

    // --- Content hash (EVM-friendly) ---
    const contentHash = "0x" + crypto.createHash("sha256").update(buf).digest("hex");

    // --- Create Asset row (so we can base paths on id) ---
    const asset = await prisma.asset.create({
        data: {
            userId,
            title,
            mime,
            size,
            contentHash,
            status: "UPLOADED",
            custody: "platform",
        },
        select: { id: true },
    });

    // --- Save original (keep original format, strip metadata) ---
    // Re-encode losslessly for PNG; for JPEG/WEBP we keep original bytes to avoid quality loss.
    // If you want to always strip metadata, we can re-encode with sharp for all types.
    const ext = extForMime(mime);
    const originalRel = path.posix.join("uploads", asset.id, `original${ext}`);
    const originalUrl = "/" + originalRel;

    // Normalize EXIF orientation and strip metadata (re-encode to same format)
    const normalized = await reencodeSameFormat(buf, mime);
    await saveFile(originalRel, normalized);

    // --- Generate thumbnail (webp, width ≤ 960) ---
    const thumbBuffer = await sharp(normalized)
        .rotate() // honor orientation again, harmless if already normalized
        .resize({ width: 960, withoutEnlargement: true, fit: "inside" })
        .webp({ quality: 82 })
        .toBuffer();

    const thumbRel = path.posix.join("uploads", asset.id, "thumb.webp");
    const thumbUrl = "/" + thumbRel;
    await saveFile(thumbRel, thumbBuffer);

    // --- Persist File rows ---
    await prisma.file.createMany({
        data: [
            { assetId: asset.id, variant: "ORIGINAL", url: originalUrl, mime, size: normalized.length },
            { assetId: asset.id, variant: "THUMB", url: thumbUrl, mime: "image/webp", size: thumbBuffer.length },
        ],
    });

    // create jobs for publishing 
    await createChainedJobsForAssetUpload(asset.id);

    return NextResponse.json({
        ok: true,
        assetId: asset.id,
        title: title ?? null,
        files: { original: originalUrl, thumb: thumbUrl },
        contentHash,
        size: normalized.length,
        mime,
        status: "UPLOADED",
    });
}

async function createChainedJobsForAssetUpload(assetId : string) {
    const ipfsJob = await enqueuePinAssetToIPFS(assetId);
    const contentAssetJob = await enqueuePublishAssetKA(assetId, ipfsJob.id)
}

/* ---------- helpers ---------- */

function extForMime(m: string) {
    switch (m) {
        case "image/jpeg": return ".jpg";
        case "image/png": return ".png";
        case "image/webp": return ".webp";
        default: return "";
    }
}

/** Re-encode to same format with EXIF stripped and orientation normalized. */
async function reencodeSameFormat(buf: Buffer, mime: string) {
    const base = sharp(buf).rotate().withMetadata({ exif: undefined, icc: undefined }); // strips meta
    switch (mime) {
        case "image/jpeg":
            return base.jpeg({ quality: 90, mozjpeg: true }).toBuffer();
        case "image/png":
            return base.png({ compressionLevel: 9 }).toBuffer();
        case "image/webp":
            return base.webp({ quality: 90 }).toBuffer();
        default:
            // Fall back to original bytes if unknown (shouldn't happen due to ALLOWED check)
            return buf;
    }
}
