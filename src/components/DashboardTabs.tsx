"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type Tab = { href: string; label: string; adminOnly?: boolean };

export default function DashboardTabs({ isAdmin }: { isAdmin: boolean }) {
    const pathname = usePathname();

    const tabs: Tab[] = [
        { href: "/dashboard", label: "Overview" },
        { href: "/assets", label: "Assets" },
        isAdmin ? { href: "/admin/jobs", label: "Admin", adminOnly: true } : (null as any),
    ].filter(Boolean) as Tab[];

    return (
        <nav className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
            {tabs.map((t) => {
                const active = pathname === t.href || (t.href !== "/dashboard" && pathname?.startsWith(t.href));
                return (
                    <Link
                        key={t.href}
                        href={t.href}
                        className={cn(
                            "px-3 py-1.5 text-sm rounded-md transition",
                            active
                                ? "bg-slate-900 text-white"
                                : "text-slate-700 hover:bg-slate-100"
                        )}
                    >
                        {t.label}
                    </Link>
                );
            })}
        </nav>
    );
}
