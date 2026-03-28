"use client";

import { useState, useEffect } from "react";

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

interface PerformanceData {
  date: string;
  current: number;
  changes: {
    day_1: number | null;
    day_7: number | null;
    day_30: number | null;
    day_60: number | null;
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
  performance: Record<string, number | null>;
}

interface FamilyTotalData {
  members: Record<string, MemberSummary>;
  grandTotal: number;
  grandPrevTotal: number | null;
  grandAllocation: Record<string, number>;
  grandPerformance: Record<string, number | null>;
}

function pctChange(curr: number, prev: number | null): string | null {
  if (prev === null || prev === 0) return null;
  const pct = ((curr - prev) / prev) * 100;
  return (pct >= 0 ? "+" : "") + pct.toFixed(2) + "%";
}

function TotalView() {
  const [data, setData] = useState<FamilyTotalData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/family-total")
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: "40vh" }}>
        <p style={{ color: "#60606a", fontSize: 14 }}>데이터를 불러오는 중...</p>
      </div>
    );
  }
  if (!data) return null;

  const { members, grandTotal, grandPrevTotal, grandAllocation, grandPerformance } = data;
  const grandChange = pctChange(grandTotal, grandPrevTotal);

  return (
    <div className="max-w-5xl">
      {/* 총평가금액 + 자산 카테고리별 비중 */}
      <div className="py-8" style={{ borderBottom: "1px dashed #28282e" }}>
        <p className="text-xs uppercase tracking-widest mb-3" style={{ color: "#60606a" }}>총 평가금액</p>
        <p className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-6" style={{ color: "#f0f0ee" }}>
          ₩{Math.round(grandTotal).toLocaleString()}
        </p>
        <div className="flex flex-row flex-wrap gap-x-5 gap-y-2 mt-3 mb-6">
          <span className="text-sm" style={{ color: "#60606a" }}>
            약 {(grandTotal / 100000000).toFixed(1)}억원
          </span>
          {[
            { label: "60D", value: grandPerformance?.day_60 },
            { label: "30D", value: grandPerformance?.day_30 },
            { label: "7D",  value: grandPerformance?.day_7 },
            { label: "1D",  value: grandPerformance?.day_1 },
          ].map((item) => (
            <span key={item.label} className="font-semibold text-sm" style={{
              color: item.value == null ? "#60606a" : item.value > 0 ? "#4ade80" : "#ef4444"
            }}>
              {item.value == null ? "—" : `${item.value > 0 ? "+" : ""}${item.value.toFixed(2)}%`}
            </span>
          ))}
        </div>

        {/* 자산 카테고리별 비중 바 */}
        <p className="text-xs uppercase tracking-widest mb-4" style={{ color: "#60606a" }}>자산 카테고리별 비중</p>
        <div className="flex h-2 rounded-full overflow-hidden mb-5">
          {CATEGORY_ORDER.map((cat) => {
            const pct = grandAllocation[cat] ?? 0;
            if (pct === 0) return null;
            return (
              <div key={cat} style={{ width: `${pct}%`, background: CATEGORY_COLOR[cat] ?? "#888" }} title={`${cat}: ${pct.toFixed(2)}%`} />
            );
          })}
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {CATEGORY_ORDER.map((cat) => {
            const pct = grandAllocation[cat] ?? 0;
            if (pct === 0) return null;
            return (
              <div key={cat} className="flex items-center gap-1.5" title={cat}>
                <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0" style={{ background: CATEGORY_COLOR[cat] ?? "#888" }} />
                <span className="text-sm font-bold" style={{ color: "#f0f0ee" }}>{pct.toFixed(1)}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 멤버 성과 테이블 */}
      <div className="py-8">
        <div className="overflow-x-auto" style={{ border: "1px solid #28282e", borderRadius: 8 }}>
          <table className="w-full text-sm" style={{ tableLayout: "auto" }}>
            <thead>
              <tr style={{ background: "#141416", borderBottom: "1px solid #28282e" }}>
                <th className="px-3 py-3 text-left font-medium"
                  style={{ color: "#60606a", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  멤버
                </th>
                <th className="px-3 py-3 text-right font-medium"
                  style={{ color: "#60606a", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  총평가금액
                </th>
                <th className="px-3 py-3 text-right font-medium"
                  style={{ color: "#60606a", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  60D-30D-7D-1D
                </th>
              </tr>
            </thead>
            <tbody>
              {(["Dirac & Broglie", "Susie", "Jintae", "Hyunhee"] as const).map((member, i) => {
                const info = members[member];
                if (!info) return null;
                const bgColor = i % 2 === 0 ? "#0c0c0e" : "#111113";
                return (
                  <tr key={member}
                    style={{
                      borderBottom: "1px solid #1e1e24",
                      background: bgColor,
                      transition: "background-color 0.15s",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#1a1a1f"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = bgColor}
                  >
                    <td className="px-3 py-3 font-medium" style={{ color: "#f0f0ee" }}>
                      {member}
                    </td>
                    <td className="px-3 py-3 text-right font-medium" style={{ color: "#f0f0ee", fontSize: "0.8rem" }}>
                      ₩{Math.round(info.total).toLocaleString()}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <div className="flex flex-wrap gap-x-1.5 gap-y-0.5 justify-end" style={{ fontSize: "0.75rem" }}>
                        {[
                          { label: "60D", value: info.performance.day_60 },
                          { label: "30D", value: info.performance.day_30 },
                          { label: "7D", value: info.performance.day_7 },
                          { label: "1D", value: info.performance.day_1 },
                        ].map((item) => (
                          <span key={item.label} style={{
                            color: item.value === null ? "#60606a" : item.value > 0 ? "#4ade80" : "#ef4444"
                          }}>
                            {item.value === null ? "—" : `${item.value > 0 ? "+" : ""}${item.value.toFixed(2)}%`}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// performance.json 키 매핑 (멤버명 → performance.json 키)
const MEMBER_PERF_KEY: Record<string, string> = {
  "Susie": "Susie",
  "Jintae": "Jintae",
  "Hyunhee": "Hyunhee",
};

function MemberView({ member }: { member: Member }) {
  const [activeCategory, setActiveCategory] = useState("Total");
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [loading, setLoading] = useState(true);
  const [memberPerf, setMemberPerf] = useState<Record<string, number | null> | null>(null);

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
      .then((json: { members?: Record<string, { changes: Record<string, number | null> }> }) => {
        const key = MEMBER_PERF_KEY[member];
        setMemberPerf(key ? (json.members?.[key]?.changes ?? null) : null);
      })
      .catch(() => setMemberPerf(null));
  }, [member]);

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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 mb-0" style={{ borderBottom: "1px dashed #28282e" }}>
        <div className="py-6 sm:py-8 pr-0 sm:pr-8 border-b sm:border-b-0 sm:border-r"
          style={{ borderColor: "#28282e", borderStyle: "dashed" }}>
          <p className="text-xs uppercase tracking-widest mb-3" style={{ color: "#60606a" }}>총 평가금액(60D-30D-7D-1D)</p>
          <p className="text-2xl sm:text-3xl lg:text-4xl font-bold" style={{ color: "#f0f0ee" }}>
            ₩{Math.round(totalKRW).toLocaleString()}
          </p>
          <div className="flex flex-row gap-x-5 gap-y-2 mt-3 flex-wrap">
            <span className="text-sm" style={{ color: "#60606a" }}>
              약 {(totalKRW / 100000000).toFixed(1)}억원
            </span>
            {memberPerf ? [
              { label: "60D", value: memberPerf.day_60 },
              { label: "30D", value: memberPerf.day_30 },
              { label: "7D",  value: memberPerf.day_7 },
              { label: "1D",  value: memberPerf.day_1 },
            ].map((item) => (
              <span key={item.label} className="font-semibold text-sm" style={{
                color: item.value == null ? "#60606a" : item.value > 0 ? "#4ade80" : "#ef4444"
              }}>
                {item.value == null ? "—" : `${item.value > 0 ? "+" : ""}${item.value.toFixed(2)}%`}
              </span>
            )) : null}
          </div>
        </div>
        <div className="py-5 sm:py-8 sm:px-8">
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {allocation.slice(0, 4).map((a) => (
              <div key={a.label} className="flex items-center gap-1.5 text-sm" title={a.label}>
                <span className="w-2 h-2 rounded-full inline-block shrink-0" style={{ background: a.color }} />
                <span className="font-bold" style={{ color: "#f0f0ee" }}>{a.pct.toFixed(1)}%</span>
              </div>
            ))}
          </div>
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
        <table className="w-full text-sm" style={{ tableLayout: "fixed" }}>
          <thead>
            <tr style={{ background: "#141416", borderBottom: "1px solid #28282e" }}>
              <th className="px-2 sm:px-3 py-3 text-left font-medium"
                style={{ color: "#60606a", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", width: "30%" }}>
                종목명
              </th>
              <th className="px-2 sm:px-3 py-3 text-right font-medium"
                style={{ color: "#60606a", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", width: "28%" }}>
                평가금액
              </th>
              <th className="px-2 sm:px-3 py-3 text-right font-medium"
                style={{ color: "#60606a", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                현재가
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((h, i) => {
              const catColor = CATEGORY_COLOR[h.category] ?? "#f0f0ee";
              return (
                <tr key={`${h.ticker}-${i}`}
                  style={{
                    borderBottom: "1px solid #1e1e24",
                    background: i % 2 === 0 ? "#0c0c0e" : "#111113",
                    transition: "background-color 0.15s",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#1a1a1f"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = i % 2 === 0 ? "#0c0c0e" : "#111113"}
                >
                  <td className="px-2 sm:px-3 py-3 font-medium">
                    <div className="truncate" style={{ color: catColor }}>{h.name}</div>
                    {h.exchange !== "—" && (
                      <div className="truncate text-xs" style={{ color: "#60606a" }}>{h.ticker}</div>
                    )}
                  </td>
                  <td className="px-2 sm:px-3 py-3 text-right font-medium"
                    style={{ color: h.valuation === 0 ? "#60606a" : "#f0f0ee", fontSize: "0.8rem" }}>
                    {h.valuation === 0 ? "—" : `₩${Math.round(h.valuation).toLocaleString()}`}
                  </td>
                  <td className="px-2 sm:px-3 py-3 text-right"
                    style={{ fontSize: "0.8rem" }}>
                    <div className="font-medium" style={{ color: "#f0f0ee" }}>
                      {h.ticker === "KRW" ? "₩1" : h.ticker === "USD" ? "$1.00" : formatPrice(h.price, h.currency)}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ background: "#1a1a1e", borderTop: "1px solid #28282e" }}>
              <td className="px-2 sm:px-3 py-3 font-semibold" style={{ color: "#d4a853" }}>합계</td>
              <td className="px-2 sm:px-3 py-3 text-right font-bold" style={{ color: "#d4a853", fontSize: "0.8rem" }}>
                ₩{Math.round(filteredKRW).toLocaleString()}
              </td>
              <td></td>
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
      .then((json: { members?: Record<string, { changes: { day_1: number|null; day_7: number|null; day_30: number|null; day_60: number|null } }> }) => {
        const changes = json.members?.["D&B"]?.changes ?? null;
        setPerformance(changes ? { date: "", current: 0, changes } : null);
      })
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
              {[
                { label: "60D", value: performance?.changes?.day_60 ?? null },
                { label: "30D", value: performance?.changes?.day_30 ?? null },
                { label: "7D",  value: performance?.changes?.day_7 ?? null },
                { label: "1D",  value: performance?.changes?.day_1 ?? null },
              ].map((item) => (
                <span key={item.label} className="font-semibold text-sm" style={{
                  color: item.value === null ? "#60606a" : item.value > 0 ? "#4ade80" : "#ef4444"
                }}>
                  {item.value === null ? "—" : `${item.value > 0 ? "+" : ""}${item.value.toFixed(2)}%`}
                </span>
              ))}
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
                <>
                  <tr key={`${h.ticker}-${i}-main`}
                    style={{
                      borderBottom: CHANGES.length > 0 ? "none" : "1px solid #1e1e24",
                      background: bgColor,
                      transition: "background-color 0.15s",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#1a1a1f"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = bgColor}
                  >
                    <td className="px-2 sm:px-3 py-3 font-medium">
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
                    <tr key={`${h.ticker}-${i}-perf`}
                      style={{
                        borderBottom: "1px solid #1e1e24",
                        background: bgColor,
                      }}
                    >
                      <td className="px-2 sm:px-3 py-2">
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
                </>
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
