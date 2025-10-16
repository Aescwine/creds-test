// src/app/admin/jobs/page.tsx
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { isAdminSession } from "@/lib/authz";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import JobStatusBadge from "@/components/admin/JobStatusBadge";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminJobsPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/signin");
    if (!isAdminSession(session)) {
        return (
            <main className="p-6">
                <h1 className="text-xl font-semibold mb-2">Forbidden</h1>
                <p className="text-slate-600">You don’t have access to this area.</p>
            </main>
        );
    }

    const jobs = await prisma.job.findMany({
        orderBy: [{ createdAt: "desc" }],
        take: 50,
        select: {
            id: true,
            type: true,
            subjectId: true,
            status: true,
            attempts: true,
            maxAttempts: true,
            scheduledAt: true,
            startedAt: true,
            finishedAt: true,
            error: true,
            createdAt: true,
            updatedAt: true,
        },
    });
    type JobRow = (typeof jobs)[number];

    async function requeueJob(formData: FormData) {
        "use server";
        const id = String(formData.get("id") || "");
        if (!id) return;
        await prisma.job.update({
            where: { id },
            data: {
                status: "QUEUED",
                error: null,
                scheduledAt: new Date(),
                startedAt: null,
                finishedAt: null,
            },
        });
    }

    return (
        <main className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">Admin · Jobs</h1>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <h2 className="font-semibold">Recent Jobs</h2>
                        <span className="text-sm text-slate-500">Showing {jobs.length} latest</span>
                    </div>
                </CardHeader>
                <CardContent className="overflow-x-auto">
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
                            {jobs.map((j: JobRow) => (
                                <tr key={j.id} className="border-b last:border-b-0 align-top">
                                    <td className="py-2 pr-3">
                                        <div className="flex items-center gap-2">
                                            <JobStatusBadge status={j.status} />
                                            <span className="text-xs text-slate-500">{j.id.slice(0, 8)}</span>
                                        </div>
                                    </td>
                                    <td className="py-2 pr-3">{j.type}</td>
                                    <td className="py-2 pr-3">
                                        <div className="font-mono text-xs break-all">{j.subjectId ?? "—"}</div>
                                    </td>
                                    <td className="py-2 pr-3">
                                        {j.attempts}/{j.maxAttempts}
                                    </td>
                                    <td className="py-2 pr-3">
                                        <div className="text-xs text-slate-600 space-y-1">
                                            <div><span className="text-slate-500">Sched:</span> {fmt(j.scheduledAt)}</div>
                                            <div><span className="text-slate-500">Start:</span> {fmt(j.startedAt)}</div>
                                            <div><span className="text-slate-500">Finish:</span> {fmt(j.finishedAt)}</div>
                                        </div>
                                    </td>
                                    <td className="py-2 pr-3 max-w-[320px]">
                                        <div className="text-xs text-red-700 line-clamp-3 break-words">{j.error ?? "—"}</div>
                                    </td>
                                    <td className="py-2 pr-3">
                                        {j.status === "FAILED" ? (
                                            <form action={requeueJob}>
                                                <input type="hidden" name="id" value={j.id} />
                                                <Button variant="outline" size="sm">Requeue</Button>
                                            </form>
                                        ) : (
                                            <span className="text-xs text-slate-400">—</span>
                                        )}
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

function fmt(d?: Date | null) {
    return d ? new Date(d).toLocaleString() : "—";
}
