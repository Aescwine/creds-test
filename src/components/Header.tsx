import Link from "next/link";
import { auth, signOut } from "@/auth";
import { Button, buttonClasses } from "@/components/ui/button";
import KAStatus from "@/components/KAStatus";

export default async function Header() {
    const session = await auth();
    const userId = (session?.user as any)?.id as string | undefined;

    async function SignOut() {
        "use server";
        await signOut({ redirectTo: "/" });
    }

    return (
        <header className="sticky top-0 z-40 glass-header">
            <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
                <Link href="/" className="font-semibold">Creator C2PA MVP</Link>
                <a href="/assets/new" className="inline-flex items-center text-sm rounded-md border border-slate-300 bg-white px-3 py-1.5 hover:bg-slate-50 transition">
                    Upload new image
                </a>

                {!userId ? (
                    <nav className="flex items-center gap-3">
                        <Link href="/signin" className={buttonClasses({ variant: "outline", size: "sm" })}>
                            Sign in
                        </Link>
                    </nav>
                ) : (
                    <nav className="flex items-center gap-2">
                        {/* KA status pill */}
                        <KAStatus />
                        <Link href="/dashboard" className={buttonClasses({ variant: "outline", size: "sm" })}>
                            Dashboard
                        </Link>
                        <form action={SignOut}>
                            <Button variant="ghost" size="sm">Sign out</Button>
                        </form>
                    </nav>
                )}
            </div>
        </header>
    );
}
