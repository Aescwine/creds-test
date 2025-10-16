"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function NewAssetPage() {
    const [thumb, setThumb] = useState<string | null>(null);
    const [orig, setOrig] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const form = new FormData(e.currentTarget);
        try {
            const res = await fetch("/api/assets/upload", {
                method: "POST",
                body: form,
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || "Upload failed");
            setThumb(json.files?.thumb ?? null);
            setOrig(json.files?.original ?? null);
        } catch (err: any) {
            setError(err.message ?? "Error");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Upload image</h1>
            <form onSubmit={onSubmit} className="space-y-3">
                <input name="title" placeholder="Optional title" className="border rounded px-3 py-2 w-full" />
                <input name="file" type="file" accept="image/jpeg,image/png,image/webp" className="block" />
                <Button type="submit" disabled={loading}>{loading ? "Uploading…" : "Upload"}</Button>
            </form>

            {error && <p className="text-sm text-red-600">{error}</p>}

            {thumb && (
                <div className="space-y-2">
                    <p className="text-sm text-slate-600">Preview (thumb):</p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={thumb} alt="thumb" className="rounded border max-w-xs" />
                </div>
            )}
            {orig && (
                <p className="text-xs text-slate-500">Original saved at: <code>{orig}</code></p>
            )}
        </div>
    );
}
