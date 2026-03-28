"use client";

import React, { useState, useEffect } from "react";

const DEFAULT_PASSWORD = "980612";

function PasswordGate({ onAuth }: { onAuth: () => void }) {
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const current = localStorage.getItem("dnb_password") || DEFAULT_PASSWORD;
    if (input === current) {
      sessionStorage.setItem("dnb_auth", "1");
      onAuth();
    } else {
      setError(true);
      setShake(true);
      setInput("");
      setTimeout(() => setShake(false), 500);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center" style={{ minHeight: "60vh" }}>
      <div
        style={{
          background: "#111113",
          border: "1px solid #28282e",
          borderRadius: 12,
          padding: "48px 56px",
          width: "100%",
          maxWidth: 400,
          animation: shake ? "shake 0.4s ease" : undefined,
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-inter), Arial, sans-serif",
            fontWeight: 700,
            fontSize: 22,
            color: "#f0f0ee",
            marginBottom: 8,
            letterSpacing: "-0.02em",
          }}
        >
          Family
        </p>
        <p style={{ fontSize: 14, color: "#60606a", marginBottom: 32 }}>
          This section is private. Enter the password to continue.
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={input}
            onChange={(e) => { setInput(e.target.value); setError(false); }}
            placeholder="Password"
            autoFocus
            style={{
              width: "100%",
              background: "#0c0c0e",
              border: `1px solid ${error ? "#ef4444" : "#28282e"}`,
              borderRadius: 6,
              padding: "10px 14px",
              color: "#f0f0ee",
              fontSize: 15,
              outline: "none",
              marginBottom: error ? 8 : 20,
              boxSizing: "border-box",
              transition: "border-color 0.2s",
            }}
          />
          {error && (
            <p style={{ color: "#ef4444", fontSize: 13, marginBottom: 16 }}>
              Incorrect password. Please try again.
            </p>
          )}
          <button
            type="submit"
            style={{
              width: "100%",
              background: "#FA660F",
              color: "#fff",
              fontWeight: 700,
              fontSize: 14,
              border: "none",
              borderRadius: 6,
              padding: "10px 0",
              cursor: "pointer",
              letterSpacing: "0.01em",
            }}
          >
            Unlock
          </button>
        </form>
      </div>
      <style>{`
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20%      { transform: translateX(-8px); }
          40%      { transform: translateX(8px); }
          60%      { transform: translateX(-6px); }
          80%      { transform: translateX(6px); }
        }
      `}</style>
    </div>
  );
}

interface Holding {
  name: string;
  ticker: string;
  exchange: string;
  category: string;
  currency: string;
  qty: number;
  price: number;
  valuation: number;
  price_changes?: {
    day_1: number | null;
    day_7: number | null;
    day_30: number | null;
    day_60: number | null;
  };
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

interface PerformanceData {
  date: string;
  members: {
    Total: MemberPerf;
    "D&B": MemberPerf;
    Susie: MemberPerf;
    Jintae: MemberPerf;
    Hyunhee: MemberPerf;
  };
}

const MEMBERS = ["Susie", "Jintae", "Hyunhee"] as const;
type Member = (typeof MEMBERS)[number];

const ALL_TABS = ["Total", "Dirac & Broglie", "Susie", "Jintae", "Hyunhee"] as const;
type Tab = (typeof ALL_TABS)[number];

const CATEGORIES = ["Total", "Cash", "Gold", "Kor Stock", "US Stock", "US Bonds", "Crypto"];

function formatPrice(price: number, currency: string) {
  if (currency === "USD") {
    if (price === 1) return "$1.00";
    return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (price === 1) return "₩1";
  return `₩${price.toLocaleString()}`;
}

function computeAllocation(holdings: Holding[]) {
  const totalKRW = holdings.reduce((s, h) => s + h.valuation, 0);
  if (totalKRW === 0) return [];

  const groups: Record<string, number> = {};
  for (const h of holdings) {
    groups[h.category] = (groups[h.category] ?? 0) + h.valuation;
  }

  const COLOR_MAP: Record<string, string> = {
    "Cash":      "#4ade80",
    "US Stock":  "#a78bfa",
    "US Bonds":  "#f472b6",
    "Gold":      "#d4a853",
    "Kor Stock": "#60a5fa",
    "Crypto":    "#f97316",
  };

  const ORDER = ["Crypto", "Cash", "Gold", "Kor Stock", "US Stock", "US Bonds"];
  return Object.entries(groups)
    .map(([label, krw]) => ({
      label,
      pct: (krw / totalKRW) * 100,
      color: COLOR_MAP[label] ?? "#888",
    }))
    .sort((a, b) => {
      const ia = ORDER.indexOf(a.label);
      const ib = ORDER.indexOf(b.label);
      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    });
}

const TOTAL_DISPLAY_MEMBERS = ["Total", "Dirac & Broglie", "Susie", "Jintae", "Hyunhee"] as const;
const CATEGORY_ORDER = ["Crypto", "Cash", "Gold", "Kor Stock", "US Stock", "US Bonds"];
const CATEGORY_COLOR: Record<string, string> = {
  "Cash":      "#4ade80",
  "Gold":      "#d4a853",
  "Kor Stock": "#60a5fa",
  "US Stock":  "#a78bfa",
  "US Bonds":  "#f472b6",
  "Crypto":    "#f97316",
};

interface MemberSummary {
  total: number;
  prevTotal: number | null;
  allocation: Record<string, number>;
}

interface FamilyTotalData {
  members: Record<string, MemberSummary>;
  grandTotal: number;
  grandPrevTotal: number | null;
  grandAllocation: Record<string, number>;
}

function pctChange(curr: number, prev: number | null): string | null {
  if (prev === null || prev === 0) return null;
  const pct = ((curr - prev) / prev) * 100;
  return (pct >= 0 ? "+" : "") + pct.toFixed(2) + "%";
}

// SVG 도넛 파이차트
function DonutChart({ slices }: { slices: { pct: number; color: string; cat: string }[] }) {
  const cx = 50, cy = 50, R = 42, r = 24;
  let angle = -Math.PI / 2;
  const paths = slices.map((s) => {
    const sweep = (s.pct / 100) * 2 * Math.PI;
    const x1 = cx + R * Math.cos(angle);
    const y1 = cy + R * Math.sin(angle);
    const ix1 = cx + r * Math.cos(angle);
    const iy1 = cy + r * Math.sin(angle);
    angle += sweep;
    const x2 = cx + R * Math.cos(angle);
    const y2 = cy + R * Math.sin(angle);
    const ix2 = cx + r * Math.cos(angle);
    const iy2 = cy + r * Math.sin(angle);
    const large = sweep > Math.PI ? 1 : 0;
    const d = `M${x1} ${y1} A${R} ${R} 0 ${large} 1 ${x2} ${y2} L${ix2} ${iy2} A${r} ${r} 0 ${large} 0 ${ix1} ${iy1} Z`;
    return { d, color: s.color, cat: s.cat, pct: s.pct };
  });
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      {paths.map((p, i) => (
        <path key={i} d={p.d} fill={p.color} stroke="#0a0a0c" strokeWidth="1.2">
          <title>{p.cat}: {p.pct.toFixed(1)}%</title>
        </path>
      ))}
    </svg>
  );
}

// 수익률 4개 표시 행
function PerfChanges({ changes }: { changes?: MemberPerf["changes"] | null }) {
  if (!changes) return <span style={{ color: "#60606a", fontSize: 12 }}>—</span>;
  return (
    <div className="flex flex-row gap-x-4">
      {(["day_60", "day_30", "day_7", "day_1"] as const).map((key) => {
        const val = changes[key];
        return (
          <span key={key} className="font-semibold text-sm" style={{
            color: val === null ? "#60606a" : val > 0 ? "#4ade80" : "#ef4444",
          }}>
            {val === null ? "—" : `${val > 0 ? "+" : ""}${val.toFixed(2)}%`}
          </span>
        );
      })}
    </div>
  );
}

function TotalView() {
  const [data, setData] = useState<FamilyTotalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [performance, setPerformance] = useState<PerformanceData | null>(null);

  useEffect(() => {
    fetch("/api/family-total")
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch(
      "https://raw.githubusercontent.com/jtkimpr/finance-watch/main/data/performance.json",
      { cache: "no-store" }
    )
      .then((r) => r.json())
      .then((d: PerformanceData) => setPerformance(d))
      .catch(() => setPerformance(null));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: "40vh" }}>
        <p style={{ color: "#60606a", fontSize: 14 }}>데이터를 불러오는 중...</p>
      </div>
    );
  }
  if (!data) return null;

  const { members, grandTotal, grandAllocation } = data;

  // 파이차트용 슬라이스 생성
  const makeSlices = (alloc: Record<string, number>) =>
    CATEGORY_ORDER
      .map((cat) => ({ cat, pct: alloc[cat] ?? 0, color: CATEGORY_COLOR[cat] ?? "#888" }))
      .filter((s) => s.pct > 0);

  const MEMBER_PERF_KEY: Record<string, keyof PerformanceData["members"]> = {
    "Dirac & Broglie": "D&B",
    "Susie": "Susie",
    "Jintae": "Jintae",
    "Hyunhee": "Hyunhee",
  };

  return (
    <div className="max-w-5xl">

      {/* ① Total 헤더 */}
      <div className="py-6 sm:py-8" style={{ borderBottom: "1px dashed #28282e" }}>
        <p className="text-xs uppercase tracking-widest mb-3" style={{ color: "#60606a" }}>
          총 평가금액(60D-30D-7D-1D)
        </p>
        <p className="text-2xl sm:text-3xl lg:text-4xl font-bold" style={{ color: "#f0f0ee" }}>
          ₩{Math.round(grandTotal).toLocaleString()}
        </p>
        <div className="mt-3">
          <PerfChanges changes={performance?.members.Total?.changes} />
        </div>
      </div>

      {/* ② 멤버별 헤더 2×2 그리드 */}
      <div className="grid grid-cols-2 gap-0 py-6" style={{ borderBottom: "1px dashed #28282e" }}>
        {(["Dirac & Broglie", "Susie", "Jintae", "Hyunhee"] as const).map((m, idx) => {
          const info = members[m];
          const perfKey = MEMBER_PERF_KEY[m];
          const perf = performance?.members[perfKey];
          const isRightCol = idx % 2 === 1;
          const isBottomRow = idx >= 2;
          return (
            <div
              key={m}
              className="py-4"
              style={{
                paddingLeft: isRightCol ? "1.5rem" : 0,
                paddingRight: isRightCol ? 0 : "1.5rem",
                borderLeft: isRightCol ? "1px dashed #28282e" : undefined,
                borderTop: isBottomRow ? "1px dashed #28282e" : undefined,
              }}
            >
              <p className="text-xs uppercase tracking-widest mb-2" style={{ color: "#60606a" }}>
                {m}(60D-30D-7D-1D)
              </p>
              <p className="text-base sm:text-lg font-bold mb-1" style={{ color: "#f0f0ee" }}>
                ₩{info ? Math.round(info.total).toLocaleString() : "—"}
              </p>
              <PerfChanges changes={perf?.changes} />
            </div>
          );
        })}
      </div>

      {/* ③ 파이차트 5개 */}
      <div className="py-8">
        <p className="text-xs uppercase tracking-widest mb-6" style={{ color: "#60606a" }}>
          자산 카테고리별 비중
        </p>

        {/* 차트 그리드 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
          {TOTAL_DISPLAY_MEMBERS.map((label) => {
            const alloc = label === "Total" ? grandAllocation : members[label]?.allocation ?? {};
            const slices = makeSlices(alloc);
            if (slices.length === 0) return null;

            // 총액 (차트 중앙에 표시할 금액)
            const amount = label === "Total"
              ? grandTotal
              : members[label]?.total ?? 0;

            return (
              <div key={label} className="flex flex-col items-center">
                <div className="relative w-28 h-28">
                  <DonutChart slices={slices} />
                  {/* 중앙 텍스트 */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span style={{ color: "#f0f0ee", fontSize: 9, fontWeight: 700, lineHeight: 1.2 }}>
                      {(amount / 100000000).toFixed(1)}억
                    </span>
                  </div>
                </div>
                <p className="text-xs mt-2 text-center font-medium" style={{ color: "#a0a0a8" }}>
                  {label}
                </p>
                {/* 비중 수치 */}
                <div className="flex flex-col gap-0.5 mt-2 w-full">
                  {slices.map((s) => (
                    <div key={s.cat} className="flex items-center justify-between text-xs gap-1">
                      <div className="flex items-center gap-1 min-w-0">
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: s.color }} />
                        <span className="truncate" style={{ color: "#60606a" }}>{s.cat}</span>
                      </div>
                      <span style={{ color: "#a0a0a8", fontWeight: 600 }}>{s.pct.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* 범례 */}
        <div className="flex flex-wrap gap-x-6 gap-y-1 mt-8 pt-6" style={{ borderTop: "1px dashed #28282e" }}>
          {CATEGORY_ORDER.map((cat) => (
            <div key={cat} className="flex items-center gap-1.5 text-xs">
              <span className="w-2 h-2 rounded-full inline-block shrink-0" style={{ background: CATEGORY_COLOR[cat] ?? "#888" }} />
              <span style={{ color: "#8a8a92" }}>{cat}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

function MemberView({ member }: { member: Member }) {
  const [activeCategory, setActiveCategory] = useState("Total");
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [loading, setLoading] = useState(true);
  const [performance, setPerformance] = useState<PerformanceData | null>(null);

  useEffect(() => {
    setLoading(true);
    setHoldings([]);
    setActiveCategory("Total");
    fetch(`/api/family?member=${member}`)
      .then((r) => r.json())
      .then((data: Holding[]) => setHoldings(data))
      .finally(() => setLoading(false));
  }, [member]);

  useEffect(() => {
    fetch(
      "https://raw.githubusercontent.com/jtkimpr/finance-watch/main/data/performance.json",
      { cache: "no-store" }
    )
      .then((r) => r.json())
      .then((data: PerformanceData) => setPerformance(data))
      .catch(() => setPerformance(null));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: "40vh" }}>
        <p style={{ color: "#60606a", fontSize: 14 }}>데이터를 불러오는 중...</p>
      </div>
    );
  }

  const usedCategories = CATEGORIES.filter(
    (cat) => cat === "Total" || holdings.some((h) => h.category === cat)
  );

  const filtered = activeCategory === "Total"
    ? holdings
    : holdings.filter((h) => h.category === activeCategory);

  const totalKRW    = holdings.reduce((s, h) => s + h.valuation, 0);
  const filteredKRW = filtered.reduce((s, h) => s + h.valuation, 0);
  const allocation  = computeAllocation(holdings);

  return (
    <div className="max-w-5xl">
      {/* 핵심 지표 */}
      <div className="py-6 sm:py-8" style={{ borderBottom: "1px dashed #28282e" }}>
        <p className="text-xs uppercase tracking-widest mb-3" style={{ color: "#60606a" }}>총 평가금액(60D-30D-7D-1D)</p>
        <p className="text-2xl sm:text-3xl lg:text-4xl font-bold" style={{ color: "#f0f0ee" }}>
          ₩{Math.round(totalKRW).toLocaleString()}
        </p>
        <div className="flex flex-row gap-x-5 gap-y-2 mt-3">
          {performance ? (
            <>
              {(["day_60", "day_30", "day_7", "day_1"] as const).map((key) => {
                const val = performance.members[member]?.changes[key] ?? null;
                return (
                  <span key={key} className="font-semibold text-sm" style={{
                    color: val === null ? "#60606a" : val > 0 ? "#4ade80" : "#ef4444"
                  }}>
                    {val === null ? "—" : `${val > 0 ? "+" : ""}${val.toFixed(2)}%`}
                  </span>
                );
              })}
            </>
          ) : (
            <span style={{ color: "#60606a", fontSize: 13 }}>데이터 로딩 중...</span>
          )}
        </div>
      </div>

      {/* 자산 비중 바 */}
      <div className="py-8" style={{ borderBottom: "1px dashed #28282e" }}>
        <p className="text-xs uppercase tracking-widest mb-4" style={{ color: "#60606a" }}>자산 카테고리별 비중</p>
        <div className="flex h-2 rounded-full overflow-hidden mb-5">
          {allocation.map((a) => (
            <div key={a.label} style={{ width: `${a.pct}%`, background: a.color }} title={`${a.label}: ${a.pct.toFixed(2)}%`} />
          ))}
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {allocation.map((a) => (
            <div key={a.label} className="flex items-center gap-1.5" title={a.label}>
              <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0" style={{ background: a.color }} />
              <span className="text-sm font-bold" style={{ color: "#f0f0ee" }}>{a.pct.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* 카테고리 필터 */}
      <div className="flex flex-wrap gap-2 py-6">
        {usedCategories.map((cat) => {
          const isActive = activeCategory === cat;
          const catColor = cat === "Total" ? "#d4a853" : (CATEGORY_COLOR[cat] ?? "#d4a853");
          return (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className="px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm transition-all"
              style={{
                background: isActive ? `${catColor}22` : "#1a1a1e",
                color: isActive ? catColor : `${catColor}99`,
                border: "1px solid",
                borderColor: isActive ? catColor : `${catColor}44`,
                fontWeight: isActive ? 600 : 400,
              }}>
              {cat}
            </button>
          );
        })}
      </div>

      {/* 테이블 */}
      <div className="overflow-x-auto" style={{ border: "1px solid #28282e", borderRadius: 8 }}>
        <table className="w-full text-sm" style={{ tableLayout: "auto" }}>
          <thead>
            <tr style={{ background: "#141416", borderBottom: "1px solid #28282e" }}>
              <th className="px-2 sm:px-3 py-3 text-left font-medium"
                style={{ color: "#60606a", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                종목명(60D-30D-7D-1D)
              </th>
              <th className="px-2 sm:px-3 py-3 text-right font-medium"
                style={{ color: "#60606a", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
                현재가
              </th>
              <th className="px-2 sm:px-3 py-3 text-right font-medium"
                style={{ color: "#60606a", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
                평가금액
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((h, i) => {
              const catColor = CATEGORY_COLOR[h.category] ?? "#f0f0ee";
              const CHANGES = h.price_changes ? [
                { value: h.price_changes.day_60 },
                { value: h.price_changes.day_30 },
                { value: h.price_changes.day_7 },
                { value: h.price_changes.day_1 },
              ] : [];
              const bgColor = i % 2 === 0 ? "#0c0c0e" : "#111113";
              return (
                <React.Fragment key={`${h.ticker}-${i}`}>
                  <tr
                    style={{
                      background: bgColor,
                      transition: "background-color 0.15s",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#1a1a1f"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = bgColor}
                  >
                    <td className="px-2 sm:px-3 pt-3 pb-1 font-medium">
                      <div className="truncate" style={{ color: catColor }}>{h.name}</div>
                    </td>
                    <td className="px-2 sm:px-3 py-3 text-right">
                      <div className="font-medium" style={{ color: "#f0f0ee", fontSize: "0.8rem" }}>
                        {h.ticker === "KRW" ? "₩1" : h.ticker === "USD" ? "$1.00" : formatPrice(h.price, h.currency)}
                      </div>
                    </td>
                    <td className="px-2 sm:px-3 py-3 text-right font-medium"
                      style={{ color: h.valuation === 0 ? "#60606a" : "#f0f0ee", fontSize: "0.8rem" }}>
                      {h.valuation === 0 ? "—" : `₩${Math.round(h.valuation).toLocaleString()}`}
                    </td>
                  </tr>
                  {CHANGES.length > 0 && (
                    <tr style={{ borderBottom: "1px solid #1e1e24", background: bgColor }}>
                      <td className="px-2 sm:px-3 pb-2 pt-0">
                        <div className="flex flex-wrap gap-x-2 gap-y-0.5" style={{ fontSize: "0.75rem" }}>
                          {CHANGES.map((item, idx) => (
                            <span key={idx} style={{
                              color: item.value === null ? "#60606a" : item.value > 0 ? "#4ade80" : "#ef4444"
                            }}>
                              {item.value === null ? "—" : `${item.value > 0 ? "+" : ""}${item.value.toFixed(1)}%`}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td></td>
                      <td></td>
                    </tr>
                  )}
                  {CHANGES.length === 0 && (
                    <tr style={{ borderBottom: "1px solid #1e1e24", background: bgColor }}>
                      <td className="pb-1" colSpan={3}></td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ background: "#1a1a1e", borderTop: "1px solid #28282e" }}>
              <td className="px-2 sm:px-3 py-3 font-semibold" style={{ color: "#d4a853" }}>합계</td>
              <td></td>
              <td className="px-2 sm:px-3 py-3 text-right font-bold" style={{ color: "#d4a853", fontSize: "0.8rem" }}>
                ₩{Math.round(filteredKRW).toLocaleString()}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

const DB_CATEGORIES = ["Total", "Crypto", "Cash", "Gold", "Kor Stock", "US Stock", "US Bonds"];

function DiracBroglieView() {
  const [activeCategory, setActiveCategory] = useState("Total");
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [loading, setLoading] = useState(true);
  const [performance, setPerformance] = useState<PerformanceData | null>(null);

  useEffect(() => {
    fetch("/api/holdings-with-history")
      .then((r) => r.json())
      .then((data: Holding[]) => setHoldings(data))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch(
      "https://raw.githubusercontent.com/jtkimpr/finance-watch/main/data/performance.json",
      { cache: "no-store" }
    )
      .then((r) => r.json())
      .then((data: PerformanceData) => setPerformance(data))
      .catch(() => setPerformance(null));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: "40vh" }}>
        <p style={{ color: "#60606a", fontSize: 14 }}>데이터를 불러오는 중...</p>
      </div>
    );
  }

  const usedCategories = DB_CATEGORIES.filter(
    (cat) => cat === "Total" || holdings.some((h) => h.category === cat)
  );

  const filtered = activeCategory === "Total"
    ? holdings
    : holdings.filter((h) => h.category === activeCategory);

  const totalKRW   = holdings.reduce((s, h) => s + h.valuation, 0);
  const filteredKRW = filtered.reduce((s, h) => s + h.valuation, 0);
  const allocation  = computeAllocation(holdings);

  return (
    <div className="max-w-5xl">
      {/* 핵심 지표 */}
      <div className="py-6 sm:py-8" style={{ borderBottom: "1px dashed #28282e" }}>
        <p className="text-xs uppercase tracking-widest mb-3" style={{ color: "#60606a" }}>총 평가금액(60D-30D-7D-1D)</p>
        <p className="text-2xl sm:text-3xl lg:text-4xl font-bold" style={{ color: "#f0f0ee" }}>
          ₩{Math.round(totalKRW).toLocaleString()}
        </p>
        <div className="flex flex-row gap-x-5 gap-y-2 mt-3">
          {performance ? (
            <>
              {(["day_60", "day_30", "day_7", "day_1"] as const).map((key) => {
                const val = performance.members["D&B"]?.changes[key] ?? null;
                return (
                  <span key={key} className="font-semibold text-sm" style={{
                    color: val === null ? "#60606a" : val > 0 ? "#4ade80" : "#ef4444"
                  }}>
                    {val === null ? "—" : `${val > 0 ? "+" : ""}${val.toFixed(2)}%`}
                  </span>
                );
              })}
            </>
          ) : (
            <span style={{ color: "#60606a", fontSize: 13 }}>데이터 로딩 중...</span>
          )}
        </div>
      </div>

      {/* 자산 비중 바 */}
      <div className="py-8" style={{ borderBottom: "1px dashed #28282e" }}>
        <p className="text-xs uppercase tracking-widest mb-4" style={{ color: "#60606a" }}>자산 카테고리별 비중</p>
        <div className="flex h-2 rounded-full overflow-hidden mb-5">
          {allocation.map((a) => (
            <div key={a.label} style={{ width: `${a.pct}%`, background: a.color }} title={`${a.label}: ${a.pct.toFixed(2)}%`} />
          ))}
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {allocation.map((a) => (
            <div key={a.label} className="flex items-center gap-1.5" title={a.label}>
              <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0" style={{ background: a.color }} />
              <span className="text-sm font-bold" style={{ color: "#f0f0ee" }}>{a.pct.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* 카테고리 필터 */}
      <div className="flex flex-wrap gap-2 py-6">
        {usedCategories.map((cat) => {
          const isActive = activeCategory === cat;
          const catColor = cat === "Total" ? "#d4a853" : (CATEGORY_COLOR[cat] ?? "#d4a853");
          return (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className="px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm transition-all"
              style={{
                background: isActive ? `${catColor}22` : "#1a1a1e",
                color: isActive ? catColor : `${catColor}99`,
                border: "1px solid",
                borderColor: isActive ? catColor : `${catColor}44`,
                fontWeight: isActive ? 600 : 400,
              }}>
              {cat}
            </button>
          );
        })}
      </div>

      {/* 테이블 */}
      <div className="overflow-x-auto" style={{ border: "1px solid #28282e", borderRadius: 8 }}>
        <table className="w-full text-sm" style={{ tableLayout: "auto" }}>
          <thead>
            <tr style={{ background: "#141416", borderBottom: "1px solid #28282e" }}>
              <th className="px-2 sm:px-3 py-3 text-left font-medium"
                style={{ color: "#60606a", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                종목명(60D-30D-7D-1D)
              </th>
              <th className="px-2 sm:px-3 py-3 text-right font-medium"
                style={{ color: "#60606a", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                현재가
              </th>
              <th className="px-2 sm:px-3 py-3 text-right font-medium"
                style={{ color: "#60606a", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                평가금액
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((h, i) => {
              const catColor = CATEGORY_COLOR[h.category] ?? "#f0f0ee";
              const CHANGES = h.price_changes ? [
                { value: h.price_changes.day_60 },
                { value: h.price_changes.day_30 },
                { value: h.price_changes.day_7 },
                { value: h.price_changes.day_1 },
              ] : [];
              const bgColor = i % 2 === 0 ? "#0c0c0e" : "#111113";
              return (
                <React.Fragment key={`${h.ticker}-${i}`}>
                  <tr
                    style={{
                      background: bgColor,
                      transition: "background-color 0.15s",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#1a1a1f"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = bgColor}
                  >
                    <td className="px-2 sm:px-3 pt-3 pb-1 font-medium">
                      <div className="truncate" style={{ color: catColor }}>{h.name}</div>
                    </td>
                    <td className="px-2 sm:px-3 py-3 text-right">
                      <div className="font-medium" style={{ color: "#f0f0ee", fontSize: "0.8rem" }}>
                        {h.ticker === "KRW" ? "₩1" : h.ticker === "USD" ? "$1.00" : formatPrice(h.price, h.currency)}
                      </div>
                    </td>
                    <td className="px-2 sm:px-3 py-3 text-right font-medium"
                      style={{ color: h.valuation === 0 ? "#60606a" : "#f0f0ee", fontSize: "0.8rem" }}>
                      {h.valuation === 0 ? "—" : `₩${Math.round(h.valuation).toLocaleString()}`}
                    </td>
                  </tr>
                  {CHANGES.length > 0 && (
                    <tr
                      style={{ borderBottom: "1px solid #1e1e24", background: bgColor }}>
                      <td className="px-2 sm:px-3 pb-2 pt-0">
                        <div className="flex flex-wrap gap-x-2 gap-y-0.5" style={{ fontSize: "0.75rem" }}>
                          {CHANGES.map((item, idx) => (
                            <span key={idx} style={{
                              color: item.value === null ? "#60606a" : item.value > 0 ? "#4ade80" : "#ef4444"
                            }}>
                              {item.value === null ? "—" : `${item.value > 0 ? "+" : ""}${item.value.toFixed(1)}%`}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td></td>
                      <td></td>
                    </tr>
                  )}
                  {CHANGES.length === 0 && (
                    <tr
                      style={{ borderBottom: "1px solid #1e1e24", background: bgColor }}>
                      <td className="pb-1" colSpan={3}></td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ background: "#1a1a1e", borderTop: "1px solid #28282e" }}>
              <td className="px-2 sm:px-3 py-3 font-semibold" style={{ color: "#d4a853" }}>합계</td>
              <td></td>
              <td className="px-2 sm:px-3 py-3 text-right font-bold" style={{ color: "#d4a853", fontSize: "0.8rem" }}>
                ₩{Math.round(filteredKRW).toLocaleString()}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

export default function FamilyPage() {
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("Total");

  useEffect(() => {
    if (sessionStorage.getItem("dnb_auth") === "1") setAuthed(true);
    setChecking(false);
  }, []);

  if (checking) return null;
  if (!authed) return <PasswordGate onAuth={() => setAuthed(true)} />;

  return (
    <div>
      {/* 탭 */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {ALL_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "7px 16px",
              borderRadius: 6,
              fontSize: 13,
              fontWeight: activeTab === tab ? 700 : 500,
              background: activeTab === tab ? "#FA660F" : "#1a1a1e",
              color: activeTab === tab ? "#fff" : "#8a8a92",
              border: "1px solid",
              borderColor: activeTab === tab ? "#FA660F" : "#28282e",
              cursor: "pointer",
              transition: "all 0.15s",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Total"
        ? <TotalView />
        : activeTab === "Dirac & Broglie"
          ? <DiracBroglieView />
          : <MemberView member={activeTab as Member} />
      }
    </div>
  );
}
