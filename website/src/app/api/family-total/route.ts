import { NextResponse } from "next/server";

const PORTFOLIO_JSON_URL =
  "https://raw.githubusercontent.com/jtkimpr/finance-watch/main/data/portfolio.json";

const MEMBERS = ["Susie", "Dirac & Broglie", "Jintae", "Hyunhee"] as const;
const CATEGORY_ORDER = ["Crypto", "Cash", "Gold", "Kor Stock", "US Stock", "US Bonds"];

interface Holding {
  category: string;
  valuation: number;
}

function computeAllocation(holdings: Holding[]): Record<string, number> {
  const total = holdings.reduce((s, h) => s + h.valuation, 0);
  if (total === 0) return {};
  const groups: Record<string, number> = {};
  for (const h of holdings) {
    groups[h.category] = (groups[h.category] ?? 0) + h.valuation;
  }
  const result: Record<string, number> = {};
  for (const cat of CATEGORY_ORDER) {
    if (groups[cat] !== undefined) {
      result[cat] = (groups[cat] / total) * 100;
    }
  }
  return result;
}

export async function GET() {
  const res = await fetch(PORTFOLIO_JSON_URL, {
    cache: "no-store",
    headers: { "Cache-Control": "no-cache", "Pragma": "no-cache" },
  }).catch((e) => {
    console.error("[family-total] fetch error:", e);
    return null;
  });

  if (!res || !res.ok) {
    return NextResponse.json({ error: "portfolio.json fetch 실패" }, { status: 502 });
  }

  const all = await res.json();
  const prevTotals: Record<string, number> | null = all["_prev_totals"] ?? null;

  const members: Record<string, {
    total: number;
    prevTotal: number | null;
    allocation: Record<string, number>;
  }> = {};

  let grandTotal = 0;
  let grandPrevTotal: number | null = prevTotals ? 0 : null;

  // 전체(grand) 카테고리 집계용
  const allHoldings: Holding[] = [];

  for (const m of MEMBERS) {
    const holdings: Holding[] = all[m] ?? [];
    const total = holdings.reduce((s: number, h: Holding) => s + h.valuation, 0);
    grandTotal += total;
    if (grandPrevTotal !== null && prevTotals) {
      grandPrevTotal += prevTotals[m] ?? 0;
    }
    allHoldings.push(...holdings);

    members[m] = {
      total,
      prevTotal: prevTotals ? (prevTotals[m] ?? null) : null,
      allocation: computeAllocation(holdings),
    };
  }

  const grandAllocation = computeAllocation(allHoldings);

  return NextResponse.json(
    { members, grandTotal, grandPrevTotal, grandAllocation },
    { headers: { "Cache-Control": "no-store" } }
  );
}
