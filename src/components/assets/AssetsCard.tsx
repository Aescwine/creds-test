import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import AssetStatusBadge from "./AssetStatusBadge";

const IPFS_GATEWAY = process.env.NEXT_PUBLIC_IPFS_GATEWAY || "https://ipfs.io/ipfs/";
const DKG_EXPLORE = process.env.NEXT_PUBLIC_DKG_EXPLORER_BASE || "https://dkg-testnet.origintrail.io/explore?ual=";

function fmtBytes(n?: number | null) {
    if (!n) return "—";
    const units = ["B", "KB", "MB", "GB", "TB"];
    let i = 0;
    let v = n;
    while (v >= 1024 && i < units.length - 1) {
        v /= 1024;
        i++;
    }
    return `${v.toFixed(v < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

function thumbUrl(row: any): string | undefined {
    // Prefer storageUrl (S3/local static), fall back to IPFS gateway
    return row.storageUrl || (row.ipfsCid ? `${IPFS_GATEWAY}${row.ipfsCid}` : undefined);
}

export default async function AssetsCard() {
    const assets = await prisma.asset.findMany({
        orderBy: [{ createdAt: "desc" }],
        take: 25,
        select: {
            id: true,
            title: true,
            mime: true,
            size: true,
            status: true,
            ual: true,
            // storageUrl: true, // if you store it
            ipfsCid: true,
            createdAt: true,
            updatedAt: true,
            // authorVerified: true,
        },
    });

    type Asset = (typeof assets)[number]; 

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <h2 className="font-semibold">Assets</h2>
                    <span className="text-sm text-slate-500">Showing {assets.length} latest</span>
                </div>
            </CardHeader>
            <CardContent className="overflow-x-auto">
                {assets.length === 0 ? (
                    <div className="text-sm text-slate-600">No assets yet. Upload an image to see it here.</div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="text-left text-slate-500">
                            <tr className="border-b">
                                <th className="py-2 pr-3">Asset</th>
                                <th className="py-2 pr-3">Status</th>
                                <th className="py-2 pr-3">Proofs</th>
                                <th className="py-2 pr-3">Links</th>
                                <th className="py-2 pr-3">Created</th>
                            </tr>
                        </thead>
                        <tbody>
                            {assets.map((a : Asset) => (
                                <tr key={a.id} className="border-b last:border-b-0 align-top">
                                    <td className="py-2 pr-3">
                                        <div className="flex gap-3">
                                            <div className="relative h-12 w-12 flex-shrink-0 rounded bg-slate-100 overflow-hidden">
                                                {thumbUrl(a) ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img
                                                        src={thumbUrl(a)}
                                                        alt={a.name || "asset"}
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="h-full w-full grid place-items-center text-[10px] text-slate-500">No preview</div>
                                                )}
                                            </div>
                                            <div className="space-y-0.5">
                                                <div className="font-medium">{a.name || "Untitled"}</div>
                                                <div className="text-xs text-slate-500">
                                                    {a.mime || "—"} · {fmtBytes(a.size)}
                                                </div>
                                            </div>
                                        </div>
                                    </td>

                                    <td className="py-2 pr-3">
                                        <div className="space-y-1">
                                            <AssetStatusBadge status={(a.status as any) || "DRAFT"} />
                                            {a.authorVerified !== undefined && (
                                                <div className={`text-[11px] ${a.authorVerified ? "text-green-700" : "text-slate-500"}`}>
                                                    Author {a.authorVerified ? "verified" : "unverified"}
                                                </div>
                                            )}
                                        </div>
                                    </td>

                                    <td className="py-2 pr-3">
                                        <div className="text-xs text-slate-600 space-y-1">
                                            <div>
                                                <span className="text-slate-500">UAL:</span>{" "}
                                                {a.ual ? <span className="font-mono break-all">{a.ual}</span> : "—"}
                                            </div>
                                            <div>
                                                <span className="text-slate-500">CID:</span>{" "}
                                                {a.ipfsCid ? <span className="font-mono break-all">{a.ipfsCid}</span> : "—"}
                                            </div>
                                        </div>
                                    </td>

                                    <td className="py-2 pr-3">
                                        <div className="text-xs space-y-1">
                                            {a.storageUrl && (
                                                <div>
                                                    <Link href={a.storageUrl} target="_blank" className="underline">
                                                        Open (HTTP)
                                                    </Link>
                                                </div>
                                            )}
                                            {a.ipfsCid && (
                                                <div>
                                                    <Link href={`${IPFS_GATEWAY}${a.ipfsCid}`} target="_blank" className="underline">
                                                        View on IPFS
                                                    </Link>
                                                </div>
                                            )}
                                            {a.ual && (
                                                <div>
                                                    <Link href={`${DKG_EXPLORE}${encodeURIComponent(a.ual)}`} target="_blank" className="underline">
                                                        DKG Explorer
                                                    </Link>
                                                </div>
                                            )}
                                        </div>
                                    </td>

                                    <td className="py-2 pr-3 text-xs text-slate-600 whitespace-nowrap">
                                        {a.createdAt ? new Date(a.createdAt).toLocaleString() : "—"}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </CardContent>
        </Card>
    );
}
