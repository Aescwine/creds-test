import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import DashboardTabs from "@/components/DashboardTabs";
import { isAdminSession } from "@/lib/authz";

export default async function Dashboard() {
    const session = await auth();
    if (!session?.user?.id) return <main className="p-6">Not signed in.</main>;

    const isAdmin = isAdminSession(session);

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

            {/* Account card */}
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
                    </div>
                </CardContent>
            </Card>

            {/* Knowledge Asset card */}
            <Card>
                <CardHeader><h2 className="font-semibold">Knowledge Asset</h2></CardHeader>
                <CardContent className="space-y-3 text-sm">
                    <div className="grid grid-cols-2 gap-y-2">
                        <span className="text-slate-500">Status</span>
                        <span>
                            {user?.userUAL ? "Verified" : user?.kaPending ? "Creating…" : user?.kaError ? "Error" : "Not created"}
                        </span>
                        <span className="text-slate-500">UAL</span>
                        <span className="font-mono break-all">{user?.userUAL ?? "—"}</span>
                        {(user?.kaError || user?.kaAttempts) && (
                            <>
                                <span className="text-slate-500">Attempts</span>
                                <span>{user?.kaAttempts ?? 0}</span>
                                <span className="text-slate-500">Last error</span>
                                <span className="text-red-700">{user?.kaError ?? "—"}</span>
                            </>
                        )}
                    </div>
                </CardContent>
            </Card>
        </main>
    );
}
