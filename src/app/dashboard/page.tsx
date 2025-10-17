import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import DashboardTabs from "@/components/DashboardTabs";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AssetsCard from "@/components/assets/AssetsCard";
import AdminCard from "@/components/admin/AdminCard";

export default async function Dashboard({ searchParams }: { searchParams?: { tab?: string; adminTab?: string } }) {
    const session = await auth();
    if (!session?.user?.id) return <main className="p-6">Not signed in.</main>;

    const isAdmin = (session.user as any)?.role === "ADMIN";

    const sp = await searchParams;              // ✅ await before using
    const tab = (sp?.tab as string) || "overview";
    const adminTab = (sp?.adminTab as string) || "users";

    const user = await prisma.user.findUnique({
        where: { id: (session.user as any).id },
        select: {
            id: true, email: true, walletAddress: true, userUAL: true,
            kaPending: true, kaError: true, kaAttempts: true, createdAt: true, updatedAt: true,
        },
    });

    return (
        <main className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
                <DashboardTabs isAdmin={isAdmin} />
            </div>

            {tab === "overview" && (
                <>
                    <Card>
                        <CardHeader><h2 className="font-semibold">Account</h2></CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <div className="grid grid-cols-2 gap-y-2">
                                <span className="text-slate-500">User ID</span>
                                <span className="font-mono break-all">{user?.id}</span>
                                <span className="text-slate-500">Email</span>
                                <span>{user?.email ?? "—"}</span>
                                <span className="text-slate-500">Wallet</span>
                                <span className="font-mono break-all">{user?.walletAddress ?? "—"}</span>
                                <span className="text-slate-500">Created</span>
                                <span>{user?.createdAt?.toLocaleString?.() ?? "—"}</span>
                                <span className="text-slate-500">Updated</span>
                                <span>{user?.updatedAt?.toLocaleString?.() ?? "—"}</span>
                                <span className="text-slate-500">Status</span>
                                <span>
                                    {user?.userUAL ? "Verified" : user?.kaPending ? "Creating…" : user?.kaError ? "Error" : "Not created"}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}

            {tab === "assets" && <AssetsCard userId={(session.user as any).id} />}

            {tab === "admin" && (isAdmin ? (
                <AdminCard subTab={(adminTab as any) ?? "users"} />
            ) : (
                <Card>
                    <CardHeader><h2 className="font-semibold">Admin</h2></CardHeader>
                    <CardContent className="text-sm text-slate-600">You don’t have access to this area.</CardContent>
                </Card>
            ))}
        </main>
    );
}
