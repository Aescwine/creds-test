// src/app/admin/assets/page.tsx
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { isAdminSession } from "@/lib/authz";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Link from "next/link";

const IPFS_GATEWAY = process.env.NEXT_PUBLIC_IPFS_GATEWAY || "https://ipfs.io/ipfs/";
const DKG_EXPLORE = process.env.NEXT_PUBLIC_DKG_EXPLORER_BASE || "https://dkg-testnet.origintrail.io/explore?ual=";

export const dynamic = "force-dynamic";

export default async function AdminAllAssetsPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/signin");
    if (!isAdminSession(session)) {
        return <main className="p-6">Forbidden</main>;
    }

    const assets = await prisma.asset.findMany({
        orderBy: [{ createdAt: "desc" }],
        take: 100,
        select: {
            id: true, name: true, mime: true, size: true, status: true, ual: true, ipfsCid: true, createdAt: true,
            user: { select: { id: true, email: true } }, // requires relation Asset.user
        },
    });

    type Asset = (typeof assets)[number]; 

    return (
        <main className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">Admin · All Assets</h1>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <h2 className="font-semibold">Latest</h2>
                        <span className="text-sm text-slate-500">Total {assets.length}</span>
                    </div>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="text-left text-slate-500">
                            <tr className="border-b">
                                <th className="py-2 pr-3">User</th>
                                <th className="py-2 pr-3">Name</th>
                                <th className="py-2 pr-3">Status</th>
                                <th className="py-2 pr-3">Proofs</th>
                                <th className="py-2 pr-3">Links</th>
                                <th className="py-2 pr-3">Created</th>
                            </tr>
                        </thead>
                        <tbody>
                            {assets.map((a : Asset) => (
                                <tr key={a.id} className="border-b last:border-b-0 align-top">
                                    <td className="py-2 pr-3">
                                        <div className="text-xs">
                                            <div>{a.user?.email ?? "—"}</div>
                                            <div className="font-mono text-slate-500">{a.user?.id ?? "—"}</div>
                                        </div>
                                    </td>
                                    <td className="py-2 pr-3">
                                        <div className="space-y-0.5">
                                            <div className="font-medium">{a.name || "Untitled"}</div>
                                            <div className="text-xs text-slate-500">{a.mime || "—"} · {a.size ?? "—"}</div>
                                        </div>
                                    </td>
                                    <td className="py-2 pr-3">{a.status}</td>
                                    <td className="py-2 pr-3 text-xs">
                                        <div><span className="text-slate-500">UAL:</span> {a.ual ?? "—"}</div>
                                        <div><span className="text-slate-500">CID:</span> {a.ipfsCid ?? "—"}</div>
                                    </td>
                                    <td className="py-2 pr-3 text-xs space-y-1">
                                        {a.ipfsCid && <div><Link href={`${IPFS_GATEWAY}${a.ipfsCid}`} target="_blank" className="underline">IPFS</Link></div>}
                                        {a.ual && <div><Link href={`${DKG_EXPLORE}${encodeURIComponent(a.ual)}`} target="_blank" className="underline">DKG</Link></div>}
                                    </td>
                                    <td className="py-2 pr-3 text-xs text-slate-600 whitespace-nowrap">
                                        {a.createdAt ? new Date(a.createdAt).toLocaleString() : "—"}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </CardContent>
            </Card>
        </main>
    );
}
