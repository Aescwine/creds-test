import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import AdminTabs from '@/components/admin/AdminTabs'
import JobStatusBadge from "@/components/admin/JobStatusBadge";
import Link from "next/link";
import AssetStatusBadge from "../assets/AssetStatusBadge";

const IPFS_GATEWAY = process.env.NEXT_PUBLIC_IPFS_GATEWAY || "https://ipfs.io/ipfs/";
const DKG_EXPLORE = process.env.NEXT_PUBLIC_DKG_EXPLORER_BASE || "https://dkg-testnet.origintrail.io/explore?ual=";

export default async function AdminCard({ subTab }: { subTab: "users" | "assets" | "jobs" }) {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <h2 className="font-semibold">Admin</h2>
                    <AdminTabs />
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {subTab === "users" && <UsersTable />}
                {subTab === "assets" && <AllAssetsTable />}
                {subTab === "jobs" && <JobsTable />}
            </CardContent>
        </Card>
    );
}

/* ---------------- tables ---------------- */

async function UsersTable() {
    const users = await prisma.user.findMany({
        orderBy: [{ createdAt: "desc" }],
        take: 50,
        select: { id: true, email: true, role: true, userUAL: true, createdAt: true },
    });

    type User = (typeof users)[number];

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead className="text-left text-slate-500">
                    <tr className="border-b">
                        <th className="py-2 pr-3">Email</th>
                        <th className="py-2 pr-3">Role</th>
                        <th className="py-2 pr-3">User ID</th>
                        <th className="py-2 pr-3">Created</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((u: User) => (
                        <tr key={u.id} className="border-b last:border-b-0">
                            <td className="py-2 pr-3">{u.email ?? "—"}</td>
                            <td className="py-2 pr-3">{u.role}</td>
                            <td className="py-2 pr-3 font-mono text-xs break-all">{u.id}</td>
                            <td className="py-2 pr-3 text-xs">
                                <div><span className="text-slate-500">UAL:</span> {u.userUAL ?? "—"}</div>
                            </td>
                            <td className="py-2 pr-3 text-xs space-y-1">
                                {u.userUAL && (
                                    <div>
                                        <Link href={`${DKG_EXPLORE}${encodeURIComponent(u.userUAL)}`} target="_blank" className="underline">
                                            DKG
                                        </Link>
                                    </div>
                                )}
                            </td>
                            <td className="py-2 pr-3 text-xs text-slate-600 whitespace-nowrap">
                                {u.createdAt ? new Date(u.createdAt).toLocaleString() : "—"}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

async function AllAssetsTable() {
    const assets = await prisma.asset.findMany({
        orderBy: [{ createdAt: "desc" }],
        take: 50,
        select: {
            id: true, title: true, mime: true, size: true, status: true,
            ual: true, ipfsCid: true, createdAt: true,
            user: { select: { id: true, email: true } },
        },
    });

    const fmtSize = (n?: number | null) => {
        if (!n) return "—";
        const units = ["B", "KB", "MB", "GB"];
        let i = 0, v = n;
        while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
        return `${v.toFixed(v < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
    };

    type Asset = (typeof assets)[number];

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead className="text-left text-slate-500">
                    <tr className="border-b">
                        <th className="py-2 pr-3">User</th>
                        <th className="py-2 pr-3">Asset</th>
                        <th className="py-2 pr-3">Status</th>
                        <th className="py-2 pr-3">Proofs</th>
                        <th className="py-2 pr-3">Links</th>
                        <th className="py-2 pr-3">Created</th>
                    </tr>
                </thead>
                <tbody>
                    {assets.map((a: Asset) => (
                        <tr key={a.id} className="border-b last:border-b-0 align-top">
                            <td className="py-2 pr-3 text-xs">
                                <div>{a.user?.email ?? "—"}</div>
                                <div className="font-mono text-slate-500">{a.user?.id ?? "—"}</div>
                            </td>
                            <td className="py-2 pr-3">
                                <div className="space-y-0.5">
                                    <div className="font-medium">{a.title || "Untitled"}</div>
                                    <div className="text-xs text-slate-500">{a.mime || "—"} · {fmtSize(a.size)}</div>
                                </div>
                            </td>
                            <td className="py-2 pr-3 text-xs">
                                <div className="space-y-1">
                                    <AssetStatusBadge status={(a.status as any) || "DRAFT"} />
                                    {a.authorVerified !== undefined && (
                                        <div className={`text-[11px] ${a.authorVerified ? "text-green-700" : "text-slate-500"}`}>
                                            Author {a.authorVerified ? "verified" : "unverified"}
                                        </div>
                                    )}
                                </div>
                            </td>
                            <td className="py-2 pr-3 text-xs">
                                <div><span className="text-slate-500">UAL:</span> {a.ual ?? "—"}</div>
                                <div><span className="text-slate-500">CID:</span> {a.ipfsCid ?? "—"}</div>
                            </td>
                            <td className="py-2 pr-3 text-xs space-y-1">
                                {a.ipfsCid && (
                                    <div>
                                        <Link href={`${IPFS_GATEWAY}${a.ipfsCid}`} target="_blank" className="underline">IPFS</Link>
                                    </div>
                                )}
                                {a.ual && (
                                    <div>
                                        <Link href={`${DKG_EXPLORE}${encodeURIComponent(a.ual)}`} target="_blank" className="underline">
                                            DKG
                                        </Link>
                                    </div>
                                )}
                            </td>
                            <td className="py-2 pr-3 text-xs text-slate-600 whitespace-nowrap">
                                {a.createdAt ? new Date(a.createdAt).toLocaleString() : "—"}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

async function JobsTable() {
    const jobs = await prisma.job.findMany({
        orderBy: [{ createdAt: "desc" }],
        take: 50,
        select: {
            id: true, type: true, subjectId: true, status: true,
            attempts: true, maxAttempts: true,
            scheduledAt: true, startedAt: true, finishedAt: true,
            error: true,
        },
    });

    async function requeueJob(formData: FormData) {
        "use server";
        const id = String(formData.get("id") || "");
        if (!id) return;
        await prisma.job.update({
            where: { id },
            data: { status: "QUEUED", error: null, scheduledAt: new Date(), startedAt: null, finishedAt: null },
        });
    }

    type Job = (typeof jobs)[number];

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead className="text-left text-slate-500">
                    <tr className="border-b">
                        <th className="py-2 pr-3">Status</th>
                        <th className="py-2 pr-3">Type</th>
                        <th className="py-2 pr-3">Subject</th>
                        <th className="py-2 pr-3">Attempts</th>
                        <th className="py-2 pr-3">Times</th>
                        <th className="py-2 pr-3">Error</th>
                        <th className="py-2 pr-3">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {jobs.map((j: Job) => (
                        <tr key={j.id} className="border-b last:border-b-0 align-top">
                            <td className="py-2 pr-3">
                                <div className="flex items-center gap-2">
                                    <JobStatusBadge status={j.status as any} />
                                    <span className="text-xs text-slate-500">{j.id.slice(0, 8)}</span>
                                </div>
                            </td>
                            <td className="py-2 pr-3">{j.type}</td>
                            <td className="py-2 pr-3 font-mono text-xs break-all">{j.subjectId ?? "—"}</td>
                            <td className="py-2 pr-3">{j.attempts}/{j.maxAttempts}</td>
                            <td className="py-2 pr-3 text-xs text-slate-600">
                                <div><span className="text-slate-500">Sched:</span> {fmt(j.scheduledAt)}</div>
                                <div><span className="text-slate-500">Start:</span> {fmt(j.startedAt)}</div>
                                <div><span className="text-slate-500">Finish:</span> {fmt(j.finishedAt)}</div>
                            </td>
                            <td className="py-2 pr-3 max-w-[320px]">
                                <div className="text-xs text-red-700 break-words">{j.error ?? "—"}</div>
                            </td>
                            <td className="py-2 pr-3">
                                {j.status === "FAILED" ? (
                                    <form action={requeueJob}>
                                        <input type="hidden" name="id" value={j.id} />
                                        <button className="px-2 py-1 text-xs rounded border hover:bg-slate-50">Requeue</button>
                                    </form>
                                ) : (
                                    <span className="text-xs text-slate-400">—</span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function fmt(d?: Date | null) {
    return d ? new Date(d).toLocaleString() : "—";
}
