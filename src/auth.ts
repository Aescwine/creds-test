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
            allowDangerousEmailAccountLinking: true, // ok for POC
        }),
    ],

    callbacks: {
        // 1) Persist/locate the user
        async signIn({ user, account }) {
            if (account?.provider !== "google") return false;
            const email = user.email?.toLowerCase().trim();
            if (!email) return false;

            const dbUser = await prisma.user.upsert({
                where: { email },
                update: { email },
                create: { email },
                select: { id: true, userUAL: true, kaPending: true },
            });

            if (!dbUser.userUAL && !dbUser.kaPending) {
                const content: { public: PersonLD } = {
                    public: {
                        '@context': 'https://schema.org',
                        '@type': 'Person',
                        '@id': 'urn:user:' + dbUser.id
                        // 'email': email,
                        // 'walletAddress': dbUser.walletAddress ?? undefined
                    }
                };

                try { await enqueueCreateUserKA(dbUser.id, content); } catch { /* ignore */ }
            }
            return true;
        },

        // Attach our local user id to JWT for easy access
        async jwt({ token }) {
            if (isEdgeRuntime()) return token;

            if (token?.email) {
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
