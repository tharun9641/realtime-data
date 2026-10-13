'use client';
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import Link from "next/link";
import CircularLoader from "@/components/circularLoader";

export default function LivePricePage() {
    const { id } = useParams();
    const [instId, setInstId] = useState(id ?? "");
    const [price, setPrice] = useState(null);
    const [history, setHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(true);

    useEffect(() => {
        if (id) {
            setInstId(id);
            setPrice(null);
            setHistory([]);
        }
    }, [id]);

    // Fetch 1 week of 4H candles (42 points = 7 days)
    useEffect(() => {
        if (!instId) return;
        setLoadingHistory(true);

        fetch(`https://www.okx.com/api/v5/market/candles?instId=${instId}&bar=4H&limit=42`)
            .then(res => res.json())
            .then(({ data }) => {
                const points = data
                    .map(d => ({ time: parseInt(d[0]), price: parseFloat(d[4]) }))
                    .reverse();
                setHistory(points);
            })
            .catch(err => console.error("History fetch error:", err))
            .finally(() => setLoadingHistory(false));
    }, [instId]);

    // WebSocket for live updates
    useEffect(() => {
        if (!instId) return;

        let active = true;
        const ws = new WebSocket("wss://ws.okx.com:8443/ws/v5/public");

        ws.onopen = () => {
            if (!active) { ws.close(); return; }
            ws.send(JSON.stringify({
                op: "subscribe",
                args: [{ channel: "tickers", instId }]
            }));
        };

        ws.onmessage = (event) => {
            if (!active) return;
            if (event.data === "pong") return;
            try {
                const msg = JSON.parse(event.data);
                if (msg.data) {
                    const t = msg.data[0];
                    const last = parseFloat(t.last);
                    setPrice({
                        last,
                        bid: parseFloat(t.bidPx),
                        ask: parseFloat(t.askPx),
                        vol24h: parseFloat(t.vol24h),
                    });
                    setHistory(prev => {
                        if (prev.length === 0) return prev;
                        const next = [...prev];
                        next[next.length - 1] = { ...next[next.length - 1], price: last };
                        return next;
                    });
                }
            } catch (e) { /* ignore */ }
        };

        const ping = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) ws.send("ping");
        }, 30000);

        return () => {
            active = false;
            clearInterval(ping);
            if (ws.readyState === WebSocket.OPEN) ws.close();
        };
    }, [instId]);


    // Tight Y-axis domain
    const prices = history.map(h => h.price);
    const min = prices.length ? Math.min(...prices) : 0;
    const max = prices.length ? Math.max(...prices) : 1;
    const padding = (max - min) * 0.05 || 1;

    const first = history[0]?.price;
    const last = price?.last ?? history[history.length - 1]?.price;
    const change = first && last ? ((last - first) / first) * 100 : null;
    const up = change === null || change >= 0;
    const color = up ? "var(--up)" : "var(--down)";
    const fmt = (v) => v.toLocaleString(undefined, { maximumFractionDigits: 8 });

    return (
        <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
            <Link href="/home" className="text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground">
                ← All markets
            </Link>

            <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="font-display text-2xl font-bold sm:text-3xl">{instId}</h1>
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
                            <span className={`h-2 w-2 rounded-full ${price ? "bg-up animate-pulse" : "bg-muted-foreground"}`} aria-hidden="true" />
                            {price ? "Live" : "Connecting…"}
                        </span>
                    </div>
                    <p className="mt-3 font-mono text-4xl font-semibold tabular-nums sm:text-5xl" aria-live="polite" aria-atomic="true">
                        {last != null ? `$${fmt(last)}` : "—"}
                    </p>
                </div>
                {change !== null && (
                    <p className="font-mono text-lg font-medium tabular-nums" style={{ color }}>
                        {up ? "▲" : "▼"} {Math.abs(change).toFixed(2)}% <span className="text-sm text-muted-foreground">7d</span>
                    </p>
                )}
            </div>

            <dl className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {[
                    ["Bid", price && `$${fmt(price.bid)}`],
                    ["Ask", price && `$${fmt(price.ask)}`],
                    ["24h Volume", price && fmt(price.vol24h)],
                ].map(([label, value]) => (
                    <div key={label} className="rounded-xl border border-border bg-card p-4">
                        <dt className="text-xs uppercase tracking-wider text-muted-foreground">{label}</dt>
                        <dd className="mt-1 font-mono text-lg tabular-nums">{value ?? "—"}</dd>
                    </div>
                ))}
            </dl>

            <div className="mt-6 rounded-xl border border-border bg-card p-4 sm:p-6">
                <h2 className="mb-4 text-sm font-medium text-muted-foreground">7-day price · 4H candles</h2>
                {loadingHistory ? (
                    <div className="flex h-[300px] items-center justify-center"><CircularLoader label="Loading 7-day history…" /></div>
                ) : history.length > 1 ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={history}>
                            <defs>
                                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis
                                dataKey="time"
                                tickFormatter={(ts) => new Date(ts).toLocaleDateString("en", { month: "short", day: "numeric" })}
                                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                                stroke="var(--border)"
                                minTickGap={40}
                            />
                            <YAxis
                                domain={[min - padding, max + padding]}
                                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                                stroke="var(--border)"
                                width={80}
                                tickFormatter={(v) => v >= 1000 ? v.toFixed(0) : v.toFixed(2)}
                            />
                            <Tooltip
                                contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }}
                                labelStyle={{ color: "var(--muted-foreground)" }}
                                itemStyle={{ color: "var(--foreground)" }}
                                labelFormatter={(ts) => new Date(ts).toLocaleString()}
                                formatter={(v) => [`$${Number(v).toLocaleString(undefined, { maximumFractionDigits: 2 })}`, "Price"]}
                            />
                            <Area
                                type="monotone"
                                dataKey="price"
                                stroke={color}
                                strokeWidth={2}
                                fill="url(#grad)"
                                isAnimationActive={false}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <p className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">No data available for {instId}.</p>
                )}
            </div>
        </section>
    );
}
