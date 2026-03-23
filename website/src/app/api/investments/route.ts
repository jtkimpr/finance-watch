import { NextResponse } from "next/server";

const PORTFOLIO_JSON_URL =
  "https://raw.githubusercontent.com/jtkimpr/finance-watch/main/data/portfolio.json";

export async function GET() {
  const res = await fetch(PORTFOLIO_JSON_URL, { cache: "no-store" }).catch(
    (e) => { console.error("[investments] fetch error:", e); return null; }
  );
  if (!res || !res.ok) {
    console.error("[investments] response status:", res?.status, res?.statusText);
    return NextResponse.json(
      { error: "portfolio.json fetch 실패" },
      { status: 502 }
    );
  }

  const all = await res.json();
  const holdings = all["Dirac & Broglie"] ?? [];

  return NextResponse.json(holdings, {
    headers: { "Cache-Control": "no-store" },
  });
}
