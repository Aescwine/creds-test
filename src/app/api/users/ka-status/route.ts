import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function GET() {
    const session = await auth();
    const userId = (session?.user as any)?.id as string | undefined;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { userUAL: true, kaPending: true, kaError: true, kaAttempts: true },
    });

    return NextResponse.json({
        userUAL: user?.userUAL ?? null,
        kaPending: !!user?.kaPending,
        kaError: user?.kaError ?? null,
        kaAttempts: user?.kaAttempts ?? 0,
    });
}
