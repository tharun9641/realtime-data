"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import CircularLoader from "@/components/circularLoader";
const PAGE_SIZE = 10;

const th = { textAlign: "left", padding: "8px 12px", borderBottom: "2px solid #ccc" };
const td = { padding: "8px 12px" };

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

    if (loading) return <section className="w-full min-h-screen flex items-center justify-center">
        <CircularLoader />
    </section>;

    return (
        <section className="w-full min-h-screen p-2">
            <div className="w-[80%] h-full mx-auto">
                <div className="w-full h-[20vh] flex items-center">
                    <h3 className="text-4xl font-bold text-left">View All Prices</h3>
                </div>

                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr>
                            <th style={th}>Instrument</th>
                            <th style={th}>Base</th>
                            <th style={th}>Quote</th>
                            <th style={th}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {pageData.map((i) => (
                            <tr key={i.instId} style={{ borderBottom: "1px solid #eee" }}>
                                <td style={td}>{i.instId}</td>
                                <td style={td}>{i.baseCcy}</td>
                                <td style={td}>{i.quoteCcy}</td>
                                <td style={td}>
                                    <Link href={`/home/${i.instId}`}>View</Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 16 }}>
                    <button
                        disabled={page === 1}
                        onClick={() => setPage((p) => p - 1)}
                    >
                        ← Prev
                    </button>
                    <span>Page {page} / {totalPages}</span>
                    <button
                        disabled={page === totalPages}
                        onClick={() => setPage((p) => p + 1)}
                    >
                        Next →
                    </button>
                </div>
                <div className="w-full h-[20vh] flex items-center justify-end">
                    <button className="p-2 bg-white text-black rounded-lg">
                        <a href="/">Back</a>
                    </button>
                </div>
            </div>
        </section>
    );
}   