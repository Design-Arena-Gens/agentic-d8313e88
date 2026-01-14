"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { formatChange, formatCurrency, formatCompactNumber } from "@/lib/stocks";
import type { StockQuote } from "@/lib/stocks";
import { StockCard } from "./StockCard";
import { PriceChart } from "./charts/PriceChart";
import { RealtimeTicker } from "./tickers/RealtimeTicker";

const DEFAULT_SYMBOLS = ["AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "TSLA"];

const fetcher = async (url: string) => {
  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    throw new Error("Failed to load stock data");
  }

  const data = (await response.json()) as { quotes: StockQuote[] };
  return data.quotes;
};

export const StockDashboard = () => {
  const [watchlist, setWatchlist] = useState<string[]>(DEFAULT_SYMBOLS);
  const [inputValue, setInputValue] = useState("");
  const [activeSymbol, setActiveSymbol] = useState(DEFAULT_SYMBOLS[0]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("watchlist");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as string[];
        if (Array.isArray(parsed) && parsed.length) {
          setWatchlist(parsed);
          setActiveSymbol(parsed[0]);
        }
      } catch {
        /* ignore malformed storage */
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("watchlist", JSON.stringify(watchlist));
  }, [watchlist]);

  useEffect(() => {
    if (!watchlist.includes(activeSymbol) && watchlist.length > 0) {
      setActiveSymbol(watchlist[0]);
    }
  }, [watchlist]);

  const symbolsParam = watchlist.join(",");
  const { data: quotes, error, isLoading } = useSWR(
    watchlist.length ? `/api/stocks?symbols=${symbolsParam}` : null,
    fetcher,
    {
      refreshInterval: 10000,
      keepPreviousData: true,
    },
  );

  const activeQuote = useMemo(
    () => quotes?.find((quote) => quote.symbol === activeSymbol),
    [quotes, activeSymbol],
  );

  const handleAddSymbol = () => {
    const normalized = inputValue.trim().toUpperCase();
    if (!normalized || watchlist.includes(normalized)) return;
    setWatchlist((prev) => [...prev, normalized]);
    setInputValue("");
    setActiveSymbol(normalized);
  };

  const handleRemoveSymbol = (symbol: string) => {
    setWatchlist((prev) => prev.filter((item) => item !== symbol));
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      handleAddSymbol();
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-4 pb-10 pt-10 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100 sm:text-4xl">
            Pulse Markets
          </h1>
          <p className="mt-2 max-w-xl text-sm text-zinc-600 dark:text-zinc-400">
            Real-time insights across your watchlist with intraday charts,
            market sentiment, and live pricing powered by Yahoo Finance.
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          <div className="flex w-full gap-2 sm:w-72">
            <input
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add ticker (e.g. META)"
              className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            />
            <button
              type="button"
              onClick={handleAddSymbol}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            >
              Track
            </button>
          </div>
        </div>
      </header>

      {quotes && quotes.length > 0 && (
        <RealtimeTicker quotes={quotes} onSelect={setActiveSymbol} />
      )}

      <section className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div className="space-y-3">
          <div className="rounded-2xl border border-zinc-200 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/70">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Watchlist
            </h2>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Live quotes update every 10 seconds.
            </p>
            <div className="mt-4 grid gap-3">
              {isLoading && (
                <div className="h-24 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />
              )}
              {error && (
                <p className="text-sm text-red-500">
                  Unable to load stock data. Please try again later.
                </p>
              )}
              {quotes?.map((quote) => (
                <StockCard
                  key={quote.symbol}
                  quote={quote}
                  isActive={quote.symbol === activeSymbol}
                  onSelect={setActiveSymbol}
                  onRemove={handleRemoveSymbol}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-zinc-200 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                  {activeQuote?.shortName ?? activeSymbol}
                </h2>
                <p className="text-xs uppercase tracking-wide text-zinc-500">
                  {activeSymbol}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
                  {activeQuote
                    ? formatCurrency(activeQuote.price, activeQuote.currency)
                    : "—"}
                </p>
                {activeQuote && (
                  <p
                    className={`text-sm font-medium ${activeQuote.change >= 0 ? "text-emerald-500" : "text-rose-500"}`}
                  >
                    {formatChange(activeQuote.change)}{" "}
                    <span className="text-xs text-zinc-500">
                      ({formatChange(activeQuote.changePercent)}%)
                    </span>
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6 h-72">
              {activeQuote ? (
                <PriceChart symbol={activeSymbol} currency={activeQuote.currency} />
              ) : (
                <div className="flex h-full items-center justify-center rounded-xl bg-zinc-100 text-sm text-zinc-500 dark:bg-zinc-800">
                  Select a stock to view its intraday chart.
                </div>
              )}
            </div>

            {activeQuote && (
              <dl className="mt-6 grid grid-cols-2 gap-4 text-sm text-zinc-600 dark:text-zinc-300 sm:grid-cols-4">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Market Cap
                  </dt>
                  <dd className="mt-1 font-medium">
                    {formatCompactNumber(activeQuote.marketCap)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Volume
                  </dt>
                  <dd className="mt-1 font-medium">
                    {formatCompactNumber(activeQuote.volume)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    52W High
                  </dt>
                  <dd className="mt-1 font-medium">
                    {formatCurrency(activeQuote.high52Week, activeQuote.currency)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    52W Low
                  </dt>
                  <dd className="mt-1 font-medium">
                    {formatCurrency(activeQuote.low52Week, activeQuote.currency)}
                  </dd>
                </div>
              </dl>
            )}
          </div>

          <div className="grid gap-3 rounded-2xl border border-zinc-200 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80 sm:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
                Market State
              </h3>
              <p className="mt-2 text-lg font-medium text-zinc-900 dark:text-zinc-100">
                {activeQuote?.marketState ?? "Unknown"}
              </p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Last updated{" "}
                {activeQuote
                  ? new Date(activeQuote.lastUpdated).toLocaleTimeString()
                  : "—"}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
                Change Today
              </h3>
              <p
                className={`mt-2 text-lg font-medium ${
                  (activeQuote?.change ?? 0) >= 0
                    ? "text-emerald-500"
                    : "text-rose-500"
                }`}
              >
                {activeQuote
                  ? `${formatChange(activeQuote.change)} (${formatChange(activeQuote.changePercent)}%)`
                  : "—"}
              </p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Move calculated versus previous close.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
