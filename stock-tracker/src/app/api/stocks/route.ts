import { NextResponse } from "next/server";
import type { StockQuote } from "@/lib/stocks";

const YAHOO_QUOTE_ENDPOINT =
  "https://query1.finance.yahoo.com/v7/finance/quote?symbols=";

export const runtime = "edge";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbolsParam = searchParams.get("symbols");

  if (!symbolsParam) {
    return NextResponse.json(
      { error: "Missing symbols parameter" },
      { status: 400 },
    );
  }

  const uniqueSymbols = Array.from(
    new Set(
      symbolsParam
        .split(",")
        .map((symbol) => symbol.trim().toUpperCase())
        .filter(Boolean),
    ),
  );

  if (uniqueSymbols.length === 0) {
    return NextResponse.json(
      { error: "No valid symbols provided" },
      { status: 400 },
    );
  }

  try {
    const response = await fetch(
      `${YAHOO_QUOTE_ENDPOINT}${encodeURIComponent(uniqueSymbols.join(","))}`,
      {
        headers: {
          "User-Agent": "Next.js Stock Tracker",
        },
      },
    );

    if (!response.ok) {
      throw new Error(
        `Quote request failed with status ${response.status}: ${response.statusText}`,
      );
    }

    const data = (await response.json()) as {
      quoteResponse?: { result?: any[] };
    };

    const results = data.quoteResponse?.result ?? [];

    const quotes: StockQuote[] = results
      .filter((item) => item?.symbol)
      .map((item) => ({
        symbol: item.symbol,
        shortName: item.shortName ?? item.longName ?? item.symbol,
        price: toNumber(item.regularMarketPrice),
        change: toNumber(item.regularMarketChange),
        changePercent: toNumber(item.regularMarketChangePercent),
        high52Week: nullableNumber(item.fiftyTwoWeekHigh),
        low52Week: nullableNumber(item.fiftyTwoWeekLow),
        marketCap: nullableNumber(item.marketCap),
        volume: nullableNumber(item.regularMarketVolume),
        currency: item.currency ?? "USD",
        marketState: item.marketState ?? "REGULAR",
        lastUpdated: item.regularMarketTime
          ? new Date(item.regularMarketTime * 1000).toISOString()
          : new Date().toISOString(),
      }));

    return NextResponse.json({ quotes });
  } catch (error) {
    console.error("Failed to fetch stock quotes:", error);
    return NextResponse.json(
      { error: "Failed to fetch stock quotes" },
      { status: 500 },
    );
  }
}

const toNumber = (value: unknown) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const nullableNumber = (value: unknown) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};
