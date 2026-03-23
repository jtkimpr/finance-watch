import { NextResponse } from "next/server";

const PORTFOLIO_JSON_URL =
  "https://raw.githubusercontent.com/jtkimpr/finance-watch/main/data/portfolio.json";

const VALID_MEMBERS = ["Susie", "Jintae", "Hyunhee"] as const;
type Member = (typeof VALID_MEMBERS)[number];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const member = searchParams.get("member") as Member | null;

  if (!member || !VALID_MEMBERS.includes(member)) {
    return NextResponse.json({ error: "Invalid member" }, { status: 400 });
  }

  const res = await fetch(PORTFOLIO_JSON_URL, {
    cache: "no-store",
    headers: { "Cache-Control": "no-cache", "Pragma": "no-cache" },
  }).catch(
    (e) => { console.error("[family] fetch error:", e); return null; }
  );
  if (!res || !res.ok) {
    return NextResponse.json(
      { error: "portfolio.json fetch 실패" },
      { status: 502 }
    );
  }

  const all = await res.json();
  const holdings = all[member] ?? [];

  return NextResponse.json(holdings, {
    headers: { "Cache-Control": "no-store" },
  });
}
