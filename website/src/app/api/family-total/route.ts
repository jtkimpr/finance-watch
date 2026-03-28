import { NextResponse } from "next/server";

const PORTFOLIO_JSON_URL =
  "https://raw.githubusercontent.com/jtkimpr/finance-watch/main/data/portfolio.json";
const PERFORMANCE_JSON_URL =
  "https://raw.githubusercontent.com/jtkimpr/finance-watch/main/data/performance.json";

const MEMBERS = ["Susie", "Dirac & Broglie", "Jintae", "Hyunhee"] as const;
const CATEGORY_ORDER = ["Crypto", "Cash", "Gold", "Kor Stock", "US Stock", "US Bonds"];

// performance.json 키 매핑 (portfolio.json 멤버명 → performance.json 키)
const PERF_KEY: Record<string, string> = {
  "Dirac & Broglie": "D&B",
  "Susie": "Susie",
  "Jintae": "Jintae",
  "Hyunhee": "Hyunhee",
};

interface Holding {
  category: string;
  valuation: number;
}

interface MemberPerf {
  current: number | null;
  changes: {
    day_1: number | null;
    day_7: number | null;
    day_30: number | null;
    day_60: number | null;
  };
}

interface PerformanceJson {
  date: string;
  members: Record<string, MemberPerf>;
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
  try {
    const [portfolioRes, perfRes] = await Promise.all([
      fetch(PORTFOLIO_JSON_URL, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache", "Pragma": "no-cache" },
      }),
      fetch(PERFORMANCE_JSON_URL, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache", "Pragma": "no-cache" },
      }),
    ]).catch((e) => {
      console.error("[family-total] fetch error:", e);
      return [null, null];
    });

    if (!portfolioRes?.ok || !perfRes?.ok) {
      return NextResponse.json({ error: "데이터 조회 실패" }, { status: 502 });
    }

    const all = await portfolioRes.json();
    const perfJson: PerformanceJson = await perfRes.json();
    const prevTotals: Record<string, number> | null = all["_prev_totals"] ?? null;

    const nullPerf = { day_1: null, day_7: null, day_30: null, day_60: null };

    const members: Record<string, {
      total: number;
      prevTotal: number | null;
      allocation: Record<string, number>;
      performance: Record<string, number | null>;
    }> = {};

    let grandTotal = 0;
    let grandPrevTotal: number | null = prevTotals ? 0 : null;
    const allHoldings: Holding[] = [];

    for (const m of MEMBERS) {
      const holdings: Holding[] = all[m] ?? [];
      const total = holdings.reduce((s: number, h: Holding) => s + h.valuation, 0);
      grandTotal += total;
      if (grandPrevTotal !== null && prevTotals) {
        grandPrevTotal += prevTotals[m] ?? 0;
      }
      allHoldings.push(...holdings);

      const perfKey = PERF_KEY[m] ?? m;
      const perf = perfJson.members?.[perfKey];

      members[m] = {
        total,
        prevTotal: prevTotals ? (prevTotals[m] ?? null) : null,
        allocation: computeAllocation(holdings),
        performance: perf?.changes ?? nullPerf,
      };
    }

    const grandAllocation = computeAllocation(allHoldings);
    const grandPerf = perfJson.members?.["Total"];

    return NextResponse.json(
      {
        members,
        grandTotal,
        grandPrevTotal,
        grandAllocation,
        grandPerformance: grandPerf?.changes ?? nullPerf,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("[family-total] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
