'use client';
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import Link from "next/link";

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

    return (
        <section className="w-[80%] mx-auto min-h-screen p-8">

            {instId && (
                <div className="border rounded-lg p-6 w-full">
                    <h2 className="text-2xl font-bold mb-4">{instId}</h2>

                    {price && (
                        <div className="space-y-2 mb-6">
                            <p><span className="text-gray-500">Last:</span> <span className="text-green-600 font-mono">${price.last.toLocaleString()}</span></p>
                            <p><span className="text-gray-500">Bid:</span> <span className="font-mono">${price.bid.toLocaleString()}</span></p>
                            <p><span className="text-gray-500">Ask:</span> <span className="font-mono">${price.ask.toLocaleString()}</span></p>
                            <p><span className="text-gray-500">24h Vol:</span> <span className="font-mono">{price.vol24h.toLocaleString()}</span></p>
                        </div>
                    )}

                    {loadingHistory ? (
                        <p className="text-gray-400">Loading 7-day history…</p>
                    ) : history.length > 1 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={history}>
                                <defs>
                                    <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis
                                    dataKey="time"
                                    tickFormatter={(ts) => new Date(ts).toLocaleDateString("en", { month: "short", day: "numeric" })}
                                    tick={{ fontSize: 11 }}
                                    minTickGap={40}
                                />
                                <YAxis
                                    domain={[min - padding, max + padding]}
                                    tick={{ fontSize: 11 }}
                                    width={80}
                                    tickFormatter={(v) => v >= 1000 ? v.toFixed(0) : v.toFixed(2)}
                                />
                                <Tooltip
                                    labelFormatter={(ts) => new Date(ts).toLocaleString()}
                                    formatter={(v) => [`$${Number(v).toLocaleString(undefined, { maximumFractionDigits: 2 })}`, "Price"]}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="price"
                                    stroke="#22c55e"
                                    strokeWidth={2}
                                    fill="url(#grad)"
                                    isAnimationActive={false}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="text-gray-400">No data available</p>
                    )}
                </div>
            )}
            <div className="w-full h-[20vh] flex items-center justify-end">
                <button className="p-2 bg-white text-black rounded-lg">
                    <Link href="/home">Back</Link>
                </button>
            </div>
        </section>
    );
}   