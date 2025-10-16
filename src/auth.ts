// src/auth.ts
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/db";
import { PersonLD } from "@/lib/dkg";
import { enqueueCreateUserKA } from "@/lib/jobs";

const isEdgeRuntime = () => typeof (globalThis as any).EdgeRuntime !== "undefined";

export const {
    auth,
    handlers: { GET, POST },
    signIn,
    signOut,
} = NextAuth({
    session: { strategy: "jwt" },

    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            allowDangerousEmailAccountLinking: true,
        }),
    ],

    callbacks: {
        // Persist/locate user + enqueue KA (runs on Node during sign-in)
        async signIn({ user, account }) {
            if (account?.provider !== "google") return false;
            const email = user.email?.toLowerCase().trim();
            if (!email) return false;

            const dbUser = await prisma.user.upsert({
                where: { email },
                update: { email },
                create: { email }, // role defaults to USER in Prisma schema
                select: { id: true, userUAL: true, kaPending: true },
            });

            if (!dbUser.userUAL && !dbUser.kaPending) {
                const content: { public: PersonLD } = {
                    public: {
                        "@context": "https://schema.org",
                        "@type": "Person",
                        "@id": "urn:user:" + dbUser.id,
                    },
                };
                try { await enqueueCreateUserKA(dbUser.id, content); } catch { }
            }
            return true;
        },

        // Enrich JWT with id + role on Node only; never hit Prisma on Edge
        async jwt({ token, trigger, account }) {
            // On middleware/Edge: just return token as-is (it will already have role from a Node run)
            if (isEdgeRuntime()) return token;

            // On initial sign-in or any Node request, fetch from DB and cache in token
            if (token?.sub) {
                const dbUser = await prisma.user.findUnique({
                    where: { id: token.sub },
                    select: { id: true, role: true, email: true },
                });
                if (dbUser) {
                    (token as any).id = dbUser.id;
                    (token as any).role = dbUser.role; // "USER" | "ADMIN"
                    token.email = dbUser.email ?? token.email ?? undefined;
                }
            } else if (token?.email) {
                const dbUser = await prisma.user.findUnique({
                    where: { email: token.email.toLowerCase().trim() },
                    select: { id: true, role: true, email: true },
                });
                if (dbUser) {
                    (token as any).id = dbUser.id;
                    (token as any).role = dbUser.role;
                }
            }
            return token;
        },

        async session({ session, token }) {
            if (session.user) {
                if ((token as any).id) (session.user as any).id = (token as any).id as string;
                if ((token as any).role) (session.user as any).role = (token as any).role as "USER" | "ADMIN";
            }
            return session;
        },

        // Guard /admin/* using role from token/session (no DB here)
        authorized({ request, auth }) {
            const { pathname } = request.nextUrl;
            if (!pathname.startsWith("/admin")) return true;
            const role = (auth?.user as any)?.role;
            return role === "ADMIN";
        },
    },

    secret: process.env.AUTH_SECRET,
});
