"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState<string | undefined>();

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setMsg(undefined);
        const res = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        setLoading(false);
        setMsg(res.ok ? "Registered! Now sign in." : data.error || "Error");
    }

    return (
        <div className="mx-auto max-w-md">
            <h1 className="text-2xl font-bold mb-4">Create account</h1>
            <form onSubmit={onSubmit} className="space-y-4">
                <input className="border rounded w-full p-2" placeholder="you@example.com"
                    value={email} onChange={e => setEmail(e.target.value)} />
                <input className="border rounded w-full p-2" type="password" placeholder="Password (min 8)"
                    value={password} onChange={e => setPassword(e.target.value)} />
                <Button type="submit" disabled={loading} className="w-full">
                    {loading ? "Creating…" : "Create"}
                </Button>
            </form>
            {msg && <p className="mt-3 text-sm">{msg}</p>}
        </div>
    );
}
