import { NextResponse } from "next/server";

const PORTFOLIO_JSON_URL =
  "https://raw.githubusercontent.com/jtkimpr/finance-watch/main/data/portfolio.json";
const PRICE_HISTORY_URL =
  "https://raw.githubusercontent.com/jtkimpr/finance-watch/main/data/price-history.json";

const VALID_MEMBERS = ["Susie", "Jintae", "Hyunhee"] as const;
type Member = (typeof VALID_MEMBERS)[number];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const member = searchParams.get("member") as Member | null;

  if (!member || !VALID_MEMBERS.includes(member)) {
    return NextResponse.json({ error: "Invalid member" }, { status: 400 });
  }

  const [portfolioRes, priceRes] = await Promise.all([
    fetch(PORTFOLIO_JSON_URL, { cache: "no-store" }),
    fetch(PRICE_HISTORY_URL, { cache: "no-store" }),
  ]).catch((e) => {
    console.error("[family] fetch error:", e);
    return [null, null];
  });

  if (!portfolioRes?.ok || !priceRes?.ok) {
    return NextResponse.json(
      { error: "데이터 fetch 실패" },
      { status: 502 }
    );
  }

  const all = await portfolioRes.json();
  const priceHistoryData = await priceRes.json();
  const holdings = all[member] ?? [];

  const holdingsWithHistory = holdings.map((holding: any) => {
    const priceData = priceHistoryData[holding.ticker] || {};
    return {
      ...holding,
      current_price: priceData.current_price || holding.price,
      price_changes: priceData.changes || {
        day_1: null,
        day_7: null,
        day_30: null,
        day_60: null,
      },
    };
  });

  return NextResponse.json(holdingsWithHistory, {
    headers: { "Cache-Control": "no-store" },
  });
}
