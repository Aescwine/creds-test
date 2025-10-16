import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import { hash } from "bcryptjs";

const schema = z.object({ email: z.string().email(), password: z.string().min(8) });

export async function POST(req: Request) {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

    const email = parsed.data.email.toLowerCase().trim();
    const password = parsed.data.password;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return NextResponse.json({ error: "Email already registered" }, { status: 409 });

    const passwordHash = await hash(password, 12);
    const user = await prisma.user.create({ data: { email, passwordHash } });
    return NextResponse.json({ id: user.id, email: user.email }, { status: 201 });
}
