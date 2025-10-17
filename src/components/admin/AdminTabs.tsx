"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const tabs = [
    { key: "users", label: "Users" },
    { key: "assets", label: "Assets" },
    { key: "jobs", label: "Jobs" },
];

export default function AdminTabs() {
    const pathname = usePathname();
    const sp = useSearchParams();
    const active = sp.get("adminTab") || "users";

    const makeHref = (k: string) => {
        const next = new URLSearchParams(Array.from(sp.entries()));
        next.set("tab", "admin");     // keep top-level on admin
        next.set("adminTab", k);      // set inner tab
        return `${pathname}?${next.toString()}`;
    };

    return (
        <nav className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
            {tabs.map((t) => (
                <Link
                    key={t.key}
                    href={makeHref(t.key)}
                    className={[
                        "px-3 py-1.5 text-sm rounded-md transition",
                        active === t.key ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100",
                    ].join(" ")}
                >
                    {t.label}
                </Link>
            ))}
        </nav>
    );
}
