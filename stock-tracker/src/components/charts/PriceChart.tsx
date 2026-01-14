"use client";

import useSWR from "swr";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { StockChartPoint } from "@/lib/stocks";

type PriceChartProps = {
  symbol: string;
  currency: string;
};

const fetcher = async (url: string) => {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error("Failed to load chart data");
  const data = (await response.json()) as { points: StockChartPoint[] };
  return data.points;
};

const formatTimeLabel = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

export const PriceChart = ({ symbol, currency }: PriceChartProps) => {
  const { data, error, isLoading } = useSWR(
    symbol ? `/api/chart?symbol=${symbol}&range=1d&interval=1m` : null,
    fetcher,
    { refreshInterval: 60000 },
  );

  if (isLoading) {
    return (
      <div className="h-full animate-pulse rounded-xl bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900" />
    );
  }

  if (error || !data || data.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-xl bg-zinc-100 text-sm text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
        <p>Chart data unavailable.</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="10%" stopColor="#2563eb" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#2563eb" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" opacity={0.5} />
        <XAxis
          dataKey="timestamp"
          tickFormatter={formatTimeLabel}
          stroke="#a1a1aa"
          tickLine={false}
          axisLine={false}
          minTickGap={36}
        />
        <YAxis
          dataKey="price"
          stroke="#a1a1aa"
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) =>
            new Intl.NumberFormat("en-US", {
              style: "currency",
              currency,
              maximumFractionDigits: 2,
            }).format(value as number)
          }
          width={70}
        />
        <Tooltip
          cursor={{ stroke: "#2563eb", strokeWidth: 1, strokeDasharray: "3 3" }}
          contentStyle={{
            background: "rgba(24, 24, 27, 0.85)",
            borderRadius: "0.75rem",
            border: "none",
            color: "#fafafa",
            fontSize: "0.75rem",
            padding: "0.75rem",
          }}
          labelFormatter={(label) => formatTimeLabel(Number(label))}
          formatter={(value) => {
            const numeric =
              typeof value === "number"
                ? value
                : value !== undefined
                  ? Number(value)
                  : 0;
            return [
              new Intl.NumberFormat("en-US", {
                style: "currency",
                currency,
                maximumFractionDigits: 2,
              }).format(numeric),
              symbol,
            ];
          }}
        />
        <Area
          type="monotone"
          dataKey="price"
          stroke="#2563eb"
          strokeWidth={2}
          fill="url(#priceGradient)"
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};
