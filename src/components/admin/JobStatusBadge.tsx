"use client";

export default function JobStatusBadge({ status }: { status: "QUEUED" | "RUNNING" | "DONE" | "FAILED" }) {
    const cls =
        status === "DONE"
            ? "bg-green-50 text-green-700 border-green-200"
            : status === "RUNNING"
                ? "bg-amber-50 text-amber-700 border-amber-200"
                : status === "FAILED"
                    ? "bg-red-50 text-red-700 border-red-200"
                    : "bg-slate-50 text-slate-700 border-slate-200";

    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded border text-xs ${cls}`}>
            {status}
        </span>
    );
}
