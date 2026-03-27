import { NextResponse } from "next/server";

const PORTFOLIO_JSON_URL =
  "https://raw.githubusercontent.com/jtkimpr/finance-watch/main/data/portfolio.json";
const PRICE_HISTORY_URL =
  "https://raw.githubusercontent.com/jtkimpr/finance-watch/main/data/price-history.json";

export async function GET() {
  try {
    // portfolio.json과 price-history.json 동시 요청
    const [portfolioRes, priceRes] = await Promise.all([
      fetch(PORTFOLIO_JSON_URL, { cache: "no-store" }),
      fetch(PRICE_HISTORY_URL, { cache: "no-store" }),
    ]).catch((e) => {
      console.error("[holdings-with-history] fetch error:", e);
      return [null, null];
    });

    if (!portfolioRes?.ok || !priceRes?.ok) {
      console.error(
        "[holdings-with-history] response status:",
        portfolioRes?.status,
        priceRes?.status
      );
      return NextResponse.json(
        { error: "Failed to fetch data" },
        { status: 502 }
      );
    }

    const portfolioData = await portfolioRes.json();
    const priceHistoryData = await priceRes.json();

    const holdings = portfolioData["Dirac & Broglie"] ?? [];

    // 포트폴리오와 가격 이력 데이터 병합
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
  } catch (error) {
    console.error("[holdings-with-history] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
