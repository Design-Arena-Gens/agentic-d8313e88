"use client";

import type { StockQuote } from "@/lib/stocks";
import { formatChange, formatCurrency } from "@/lib/stocks";

type RealtimeTickerProps = {
  quotes: StockQuote[];
  onSelect: (symbol: string) => void;
};

export const RealtimeTicker = ({ quotes, onSelect }: RealtimeTickerProps) => {
  if (!quotes.length) return null;

  const duplicatedQuotes = [...quotes, ...quotes];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 via-sky-50 to-blue-100 p-3 shadow-sm dark:border-blue-900/40 dark:from-blue-950 dark:via-slate-950 dark:to-blue-900/20">
      <div className="animate-marquee flex min-w-full gap-4 whitespace-nowrap">
        {duplicatedQuotes.map((quote, index) => (
          <button
            key={`${quote.symbol}-${index}`}
            type="button"
            onClick={() => onSelect(quote.symbol)}
            className="flex items-center gap-2 rounded-full bg-white/70 px-4 py-1.5 text-xs font-medium text-blue-900 shadow-sm transition hover:bg-white dark:bg-white/10 dark:text-blue-100 dark:hover:bg-white/20"
          >
            <span className="text-[0.65rem] font-semibold uppercase tracking-wide">
              {quote.symbol}
            </span>
            <span>{formatCurrency(quote.price, quote.currency)}</span>
            <span
              className={`font-semibold ${
                quote.changePercent >= 0 ? "text-emerald-500" : "text-rose-500"
              }`}
            >
              {formatChange(quote.changePercent)}%
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
