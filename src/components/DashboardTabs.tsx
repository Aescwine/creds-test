"use client";

import Link from "next/link";
import { useSearchParams, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export default function DashboardTabs({ isAdmin }: { isAdmin: boolean }) {
    const pathname = usePathname();
    const params = useSearchParams();
    const tab = params.get("tab") || "overview";

    const base = pathname || "/dashboard";
    const mk = (t: string) => `${base}?tab=${t}`;

    const tabs = [
        { key: "overview", label: "Overview" },
        { key: "assets", label: "Assets" },
        ...(isAdmin ? [{ key: "admin", label: "Admin" }] : []),
    ];

    return (
        <nav className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
            {tabs.map((t) => (
                <Link
                    key={t.key}
                    href={mk(t.key)}
                    className={cn(
                        "px-3 py-1.5 text-sm rounded-md transition",
                        tab === t.key ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
                    )}
                >
                    {t.label}
                </Link>
            ))}
        </nav>
    );
}
