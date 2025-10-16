"use client";

type Status = "DRAFT" | "QUEUED" | "PROCESSING" | "PUBLISHED" | "FAILED";

export default function AssetStatusBadge({ status }: { status: Status }) {
    const cls =
        status === "PUBLISHED"
            ? "bg-green-50 text-green-700 border-green-200"
            : status === "PROCESSING" || status === "QUEUED"
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
