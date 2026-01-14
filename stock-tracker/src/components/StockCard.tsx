"use client";

import type { StockQuote } from "@/lib/stocks";
import { formatChange, formatCurrency } from "@/lib/stocks";

type StockCardProps = {
  quote: StockQuote;
  isActive: boolean;
  onSelect: (symbol: string) => void;
  onRemove: (symbol: string) => void;
};

export const StockCard = ({ quote, isActive, onSelect, onRemove }: StockCardProps) => {
  const { symbol, shortName, price, changePercent, change, currency } = quote;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(symbol)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(symbol);
        }
      }}
      className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${
        isActive
          ? "border-blue-500 bg-blue-50/80 shadow-sm dark:border-blue-400 dark:bg-blue-500/10"
          : "border-transparent bg-zinc-100/60 hover:bg-zinc-100 dark:bg-zinc-800/60 dark:hover:bg-zinc-800"
      }`}
    >
      <div className="flex flex-1 flex-col">
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {symbol}
        </span>
        <span className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {shortName}
        </span>
      </div>
      <div className="flex flex-col items-end">
        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {formatCurrency(price, currency)}
        </span>
        <span
          className={`text-xs font-medium ${
            changePercent >= 0 ? "text-emerald-500" : "text-rose-500"
          }`}
        >
          {formatChange(change)} ({formatChange(changePercent)}%)
        </span>
      </div>
      <button
        type="button"
        className="ml-3 inline-flex h-8 w-8 items-center justify-center rounded-full border border-zinc-300 bg-white text-xs font-medium text-zinc-500 transition hover:border-zinc-400 hover:text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
        onClick={(event) => {
          event.stopPropagation();
          onRemove(symbol);
        }}
        aria-label={`Remove ${symbol} from watchlist`}
      >
        ×
      </button>
    </div>
  );
};
