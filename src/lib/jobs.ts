import { prisma } from "@/lib/db";

export async function enqueueCreateUserKA(userId: string, content: object) {
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
        console.log('Creating CreateUserKA job for user: ', userId)
        await prisma.job.create({
            data: {
                type: "CreateUserKA",
                subjectId: userId,
                payload: content,
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
        where: { type: "PinAssetToIPFS", subjectId: assetId, status: { in: ["QUEUED", "RUNNING"] } },
        select: { id: true },
    });

    if (!existing) {
        await prisma.job.create({
            data: {
                type: "PinAssetToIPFS",
                subjectId: assetId,
                payload: { assetId },
                status: "QUEUED",
                maxAttempts: 5,
            },
        });
    }
}
