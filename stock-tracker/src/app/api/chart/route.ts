import { NextResponse } from "next/server";
import type { StockChartPoint } from "@/lib/stocks";

const YAHOO_CHART_ENDPOINT = "https://query1.finance.yahoo.com/v8/finance/chart/";

export const runtime = "edge";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol")?.trim().toUpperCase();
  const range = searchParams.get("range") ?? "1d";
  const interval = searchParams.get("interval") ?? "1m";

  if (!symbol) {
    return NextResponse.json(
      { error: "Missing symbol parameter" },
      { status: 400 },
    );
  }

  const url = `${YAHOO_CHART_ENDPOINT}${symbol}?range=${encodeURIComponent(range)}&interval=${encodeURIComponent(interval)}`;

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Next.js Stock Tracker",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(
        `Chart request failed with status ${response.status}: ${response.statusText}`,
      );
    }

    const data = (await response.json()) as {
      chart?: { result?: any[]; error?: unknown };
    };

    const result = data.chart?.result?.[0];

    if (!result) {
      return NextResponse.json(
        { error: "No chart data available" },
        { status: 404 },
      );
    }

    const timestamps: number[] = result.timestamp ?? [];
    const closes: number[] = result.indicators?.quote?.[0]?.close ?? [];

    const points: StockChartPoint[] = timestamps
      .map((timestamp, index) => ({
        timestamp: timestamp * 1000,
        price: closes[index],
      }))
      .filter((point) => Number.isFinite(point.price));

    return NextResponse.json({ symbol, points });
  } catch (error) {
    console.error("Failed to fetch stock chart:", error);
    return NextResponse.json(
      { error: "Failed to fetch stock chart" },
      { status: 500 },
    );
  }
}
