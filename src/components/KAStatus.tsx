"use client";

import { useEffect, useState } from "react";

type KAStatusPayload = {
    userUAL: string | null;
    kaPending: boolean;
    kaError: string | null;
    kaAttempts: number;
};

const DKG_EXPLORER_URL =
  process.env.NEXT_PUBLIC_DKG_EXPLORER_BASE ||
  "https://dkg-testnet.origintrail.io/explore?ual=";

export default function KAStatus() {
    const [data, setData] = useState<KAStatusPayload | null>(null);
    const [loading, setLoading] = useState(true);

    async function fetchStatus() {
        try {
            const res = await fetch("/api/users/ka-status", { cache: "no-store" });
            if (!res.ok) throw new Error("Failed to load KA status");
            const json = (await res.json()) as KAStatusPayload;
            setData(json);
        } catch (e) {
            // keep previous state; optionally surface error
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchStatus();

        // Poll faster while pending, slower otherwise
        let interval: number | undefined;
        function setPolling(pending: boolean) {
            if (interval) window.clearInterval(interval);
            interval = window.setInterval(fetchStatus, pending ? 5000 : 15000);
        }

        // initial adaptive interval
        setPolling(true);

        // adapt when status changes
        const observer = setInterval(() => {
            const pending = !!data?.kaPending && !data?.userUAL;
            setPolling(pending);
        }, 3000);

        return () => {
            if (interval) window.clearInterval(interval);
            clearInterval(observer);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // derive view state
    const pending = !!data?.kaPending && !data?.userUAL;
    const verified = !!data?.userUAL && !pending;
    const error = !!data?.kaError && !verified;

    if (loading) {
        return (
            <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border bg-white">
                <Spinner /> <span>Loading…</span>
            </span>
        );
    }

    if (verified) {
        const ual = data!.userUAL!;
        const href = `${DKG_EXPLORER_URL}${encodeURIComponent(ual)}`;
        return (
            <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                title={`View on DKG Explorer\nUAL: ${ual}`}
                className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border border-green-300 bg-green-50 text-green-700 hover:bg-green-100 transition"
            >
                <Check /> <span>User Verified</span>
            </a>
        );
    }

    if (pending) {
        return (
            <span title="We’re creating your user account knowledge asset. This can take a few minutes."
                className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border border-amber-300 bg-amber-50 text-amber-700">
                <Spinner /> <span>Verifying…</span>
            </span>
        );
    }

    if (error) {
        return (
            <span title={data?.kaError ?? "Error creating user account knowledge asset"}
                className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border border-red-300 bg-red-50 text-red-700">
                <Warning /> <span>KA Error</span>
            </span>
        );
    }

    // Fallback (no KA yet, not pending)
    return (
        <span title="No Knowledge Asset yet"
            className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border bg-gray-50 text-gray-700">
            <Info /> <span>No KA</span>
        </span>
    );
}

function Spinner() {
    return (
        <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z" />
        </svg>
    );
}
function Check() {
    return (
        <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M16.7 5.3a1 1 0 00-1.4-1.4L8 11.17l-3.3-3.3a1 1 0 10-1.4 1.42l4 4a1 1 0 001.4 0l8-8z" />
        </svg>
    );
}
function Warning() {
    return (
        <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M8.257 3.099c.765-1.36 2.72-1.36 3.485 0l6.518 11.6a2 2 0 01-1.742 2.98H3.48a2 2 0 01-1.742-2.98l6.519-11.6zM11 14a1 1 0 10-2 0 1 1 0 002 0zm-1-2a1 1 0 01-1-1V8a1 1 0 112 0v3z" />
        </svg>
    );
}
function Info() {
    return (
        <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9 8h2v6H9V8zm1-4a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" />
        </svg>
    );
}
