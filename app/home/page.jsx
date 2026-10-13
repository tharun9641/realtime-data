"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import CircularLoader from "@/components/circularLoader";
import Movers from "@/components/movers";
const PAGE_SIZE = 10;

const pagerBtn = "h-10 cursor-pointer rounded-lg border border-border px-4 text-sm transition-colors duration-200 hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent";

export default function PriceTable() {
    const [instruments, setInstruments] = useState([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const api = process.env.NEXT_PUBLIC_API_URL;

        fetch(api)
            .then((res) => res.json())
            .then(({ data }) => {
                setInstruments(data.filter((i) => i.state === "live"));
            })
            .catch((err) => console.error("Fetch error:", err))
            .finally(() => setLoading(false));
    }, []);

    const totalPages = Math.ceil(instruments.length / PAGE_SIZE);
    const pageData = instruments.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    if (loading) return <section className="flex min-h-[60vh] items-center justify-center">
        <CircularLoader label="Loading markets…" />
    </section>;

    return (
        <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
            <Movers />

            <div className="mb-6 flex flex-wrap items-end justify-between gap-2">
                <div>
                    <h1 className="font-display text-2xl font-bold sm:text-3xl">Markets</h1>
                    <p className="mt-1 text-sm text-muted-foreground">{instruments.length.toLocaleString()} live instruments</p>
                </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-border bg-card">
                <table className="w-full border-collapse text-sm">
                    <thead className="bg-muted text-left text-xs uppercase tracking-wider text-muted-foreground">
                        <tr>
                            <th scope="col" className="px-4 py-3 font-medium">Instrument</th>
                            <th scope="col" className="px-4 py-3 font-medium">Base</th>
                            <th scope="col" className="px-4 py-3 font-medium">Quote</th>
                            <th scope="col" className="px-4 py-3"><span className="sr-only">Actions</span></th>
                        </tr>
                    </thead>
                    <tbody>
                        {pageData.map((i) => (
                            <tr key={i.instId} className="border-t border-border transition-colors duration-150 hover:bg-muted/60">
                                <td className="px-4 py-3 font-mono font-medium">{i.instId}</td>
                                <td className="px-4 py-3 text-muted-foreground">{i.baseCcy}</td>
                                <td className="px-4 py-3 text-muted-foreground">{i.quoteCcy}</td>
                                <td className="px-4 py-3 text-right">
                                    <Link
                                        href={`/home/${i.instId}`}
                                        className="inline-flex h-9 items-center rounded-md px-3 font-medium text-primary transition-colors duration-200 hover:bg-primary/10"
                                    >
                                        View <span className="sr-only">{i.instId}</span> →
                                    </Link>
                                </td>
                            </tr>
                        ))}
                        {pageData.length === 0 && (
                            <tr><td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">No live instruments found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <nav aria-label="Pagination" className="mt-6 flex items-center justify-between">
                    <button className={pagerBtn} disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                        ← Prev
                    </button>
                    <span className="text-sm text-muted-foreground" aria-live="polite">
                        Page <span className="font-mono text-foreground">{page}</span> of <span className="font-mono">{totalPages}</span>
                    </span>
                    <button className={pagerBtn} disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
                        Next →
                    </button>
                </nav>
            )}
        </section>
    );
}
