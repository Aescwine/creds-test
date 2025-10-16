import { create } from "kubo-rpc-client";

export type IpfsAddResult = {
    cid: string;        // e.g. "bafy..."
    uri: string;        // e.g. "ipfs://bafy.../filename.jpg" (if wrapped) or "ipfs://bafy..."
    size?: number;      // optional size if available
};

export function getKubo() {
    const endpoint = process.env.IPFS_ENDPOINT; // e.g. "https://ipfs.infura.io:5001/api/v0"
    if (!endpoint) throw new Error("Missing IPFS_ENDPOINT");

    const id = process.env.IPFS_PROJECT_ID;
    const secret = process.env.IPFS_PROJECT_SECRET;
    const auth =
        id && secret
            ? "Basic " + Buffer.from(`${id}:${secret}`).toString("base64")
            : process.env.IPFS_AUTH_HEADER; // e.g. "Bearer <pinata-jwt>"

    const headers = auth ? { authorization: auth } : undefined;

    return create({ url: endpoint, headers });
}

/**
 * Add raw bytes (Buffer/Uint8Array) to IPFS.
 * - By default we set CIDv1 + rawLeaves = true for modern CIDs
 * - We **wrap with a directory** when a filename is provided so you get ipfs://<cid>/<filename>
 * - We also explicitly pin after add (defensive, as add's pin behavior can vary)
 */
export async function ipfsAddBytes(
    bytes: Uint8Array,
    opts?: { filename?: string; pin?: boolean }
): Promise<IpfsAddResult> {
    const ipfs = getKubo();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60_000); // 60s safety
    try {
        const wrap = !!opts?.filename;
        const addRes = await ipfs.add(
            wrap ? { path: opts!.filename!, content: bytes } : bytes,
            {
                cidVersion: 1,
                rawLeaves: true,
                hashAlg: "sha2-256",
                wrapWithDirectory: wrap,
                // pin: true, // historically on by default; we explicitly pin below
                signal: controller.signal as any,
            }
        );

        const cid = addRes.cid.toString();

        // Pin explicitly to be safe (idempotent)
        if (opts?.pin !== false) {
            try { await ipfs.pin.add(addRes.cid); } catch { /* ignore if pinned */ }
        }

        const uri = wrap ? `ipfs://${cid}/${opts!.filename!}` : `ipfs://${cid}`;
        return { cid, uri };
    } finally {
        clearTimeout(timeout);
    }
}

/** Add a Node stream without buffering it all in memory (great for S3/GCS). */
export async function ipfsAddStream(
    stream: AsyncIterable<Uint8Array> | NodeJS.ReadableStream,
    opts?: { filename?: string; pin?: boolean }
): Promise<IpfsAddResult> {
    const ipfs = getKubo();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5 * 60_000); // 5m for large files
    try {
        const wrap = !!opts?.filename;
        const addRes = await ipfs.add(
            wrap ? { path: opts!.filename!, content: stream as any } : (stream as any),
            {
                cidVersion: 1,
                rawLeaves: true,
                hashAlg: "sha2-256",
                wrapWithDirectory: wrap,
                // pin: true,
                signal: controller.signal as any,
            }
        );
        const cid = addRes.cid.toString();
        if (opts?.pin !== false) {
            try { await ipfs.pin.add(addRes.cid); } catch { /* noop */ }
        }
        const uri = wrap ? `ipfs://${cid}/${opts!.filename!}` : `ipfs://${cid}`;
        return { cid, uri };
    } finally {
        clearTimeout(timeout);
    }
}
