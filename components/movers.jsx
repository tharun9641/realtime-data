"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import CircularLoader from "@/components/circularLoader";

const OKX = "https://www.okx.com/api/v5/market";
const MIN_VOLUME = 1_000_000; // USDT 24h volume, filters out illiquid pairs with meaningless swings
// shortcut: week view only ranks the 40 most-traded pairs (one candle request each, OKX limit is 40 req/2s); move to a server cache to cover every pair
const WEEK_POOL = 40;

const rank = (rows) => {
    const sorted = rows.filter((r) => isFinite(r.change)).sort((a, b) => b.change - a.change);
    return { gainers: sorted.slice(0, 5), losers: sorted.slice(-5).reverse() };
};

async function loadDay(tickers) {
    return rank(tickers.map((t) => ({ instId: t.instId, last: +t.last, change: (t.last / t.open24h - 1) * 100 })));
}

async function loadWeek(tickers) {
    const pool = [...tickers].sort((a, b) => b.volCcy24h - a.volCcy24h).slice(0, WEEK_POOL);
    const rows = await Promise.all(pool.map(async (t) => {
        const { data } = await fetch(`${OKX}/candles?instId=${t.instId}&bar=1D&limit=8`).then((r) => r.json());
        const weekAgo = data?.[7]?.[4]; // close of the daily candle 7 days back
        return { instId: t.instId, last: +t.last, change: weekAgo ? (t.last / weekAgo - 1) * 100 : NaN };
    }));
    return rank(rows);
}

function MoverList({ title, rows, up }) {
    return (
        <div className="rounded-xl border border-border bg-card">
            <h3 className="flex items-center gap-2 border-b border-border px-4 py-3 text-sm font-medium">
                <span style={{ color: up ? "var(--up)" : "var(--down)" }} aria-hidden="true">{up ? "▲" : "▼"}</span>
                {title}
            </h3>
            <ol>
                {rows.map((r) => (
                    <li key={r.instId} className="border-t border-border first:border-t-0">
                        <Link href={`/home/${r.instId}`} className="flex items-center justify-between gap-2 px-4 py-2.5 text-sm transition-colors duration-150 hover:bg-muted/60">
                            <span className="font-mono font-medium">{r.instId}</span>
                            <span className="flex items-center gap-4 font-mono tabular-nums">
                                <span className="hidden text-muted-foreground sm:inline">${r.last.toLocaleString(undefined, { maximumFractionDigits: 8 })}</span>
                                <span className="w-20 text-right" style={{ color: r.change >= 0 ? "var(--up)" : "var(--down)" }}>
                                    {r.change >= 0 ? "+" : ""}{r.change.toFixed(2)}%
                                </span>
                            </span>
                        </Link>
                    </li>
                ))}
            </ol>
        </div>
    );
}

export default function Movers() {
    const [range, setRange] = useState("day");
    const [result, setResult] = useState({});

    useEffect(() => {
        let active = true;
        fetch(`${OKX}/tickers?instType=SPOT`)
            .then((res) => res.json())
            .then(({ data }) => {
                const liquid = data.filter((t) => t.instId.endsWith("-USDT") && +t.open24h > 0 && +t.volCcy24h >= MIN_VOLUME);
                return (range === "day" ? loadDay : loadWeek)(liquid);
            })
            .then((movers) => active && setResult({ range, movers }))
            .catch((err) => {
                console.error("Movers fetch error:", err);
                if (active) setResult({ range, error: true });
            });
        return () => { active = false; };
    }, [range]);

    const loading = result.range !== range;

    return (
        <section aria-labelledby="movers-heading" className="mb-10">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 id="movers-heading" className="font-display text-lg font-bold">Top movers</h2>
                <div role="group" aria-label="Time range" className="inline-flex rounded-lg border border-border p-1">
                    {[["day", "24h"], ["week", "7d"]].map(([value, label]) => (
                        <button
                            key={value}
                            aria-pressed={range === value}
                            onClick={() => setRange(value)}
                            className={`h-8 cursor-pointer rounded-md px-4 text-sm transition-colors duration-200 ${range === value ? "bg-primary font-semibold text-on-primary" : "text-muted-foreground hover:text-foreground"}`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex h-[260px] items-center justify-center rounded-xl border border-border bg-card"><CircularLoader label="Loading movers…" /></div>
            ) : result.error ? (
                <p className="rounded-xl border border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">Couldn&apos;t load movers. Try again later.</p>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    <MoverList title="Top gainers" rows={result.movers.gainers} up />
                    <MoverList title="Top losers" rows={result.movers.losers} />
                </div>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
                USDT spot pairs with over $1M 24h volume{range === "week" && `; 7d ranks the ${WEEK_POOL} most-traded`}.
            </p>
        </section>
    );
}
