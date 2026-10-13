"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  function track(e) {
    e.preventDefault();
    const id = new FormData(e.currentTarget).get("instId").trim().toUpperCase();
    if (id) router.push(`/home/${encodeURIComponent(id)}`);
  }

  return (
    <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl flex-col items-center justify-center gap-8 px-4 text-center">
      <span className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
        <span className="h-2 w-2 rounded-full bg-up" aria-hidden="true" />
        Live market data
      </span>
      <h1 className="font-display text-4xl font-bold leading-tight text-balance sm:text-6xl">
        Track any price. <span className="text-primary">Effortlessly.</span>
      </h1>
      <p className="max-w-xl text-base text-muted-foreground sm:text-lg">
        Start tracking an instrument, or browse the prices we&apos;re already monitoring.
      </p>

      <form onSubmit={track} className="flex w-full max-w-md flex-col gap-2 sm:flex-row">
        <label htmlFor="instId" className="sr-only">Instrument ID</label>
        <input
          id="instId"
          name="instId"
          type="text"
          required
          placeholder="e.g. BTC-USDT"
          autoComplete="off"
          className="h-12 flex-1 rounded-lg border border-border bg-card px-4 font-mono text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
        />
        <button className="h-12 cursor-pointer rounded-lg bg-primary px-5 font-semibold text-on-primary transition-colors duration-200 hover:bg-primary-hover">
          Track price
        </button>
      </form>

      <Link href="/home" className="text-sm text-muted-foreground underline-offset-4 transition-colors duration-200 hover:text-foreground hover:underline">
        or browse all markets →
      </Link>
    </section>
  );
}
