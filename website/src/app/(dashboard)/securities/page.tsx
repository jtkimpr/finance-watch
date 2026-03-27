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
          Investments
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

const CATEGORIES = ["Total", "Cash", "Gold", "Kor Stock", "US Stock", "US Bonds"];

const CATEGORY_COLOR: Record<string, string> = {
  "Cash":      "#4ade80",
  "Gold":      "#d4a853",
  "Kor Stock": "#60a5fa",
  "US Stock":  "#a78bfa",
  "US Bonds":  "#f472b6",
};

function formatPrice(price: number, currency: string) {
  if (currency === "USD") {
    if (price === 1) return "$1.00";
    return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (price === 1) return "₩1";
  return `₩${price.toLocaleString()}`;
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

  return Object.entries(groups)
    .map(([label, krw]) => ({
      label,
      pct: (krw / totalKRW) * 100,
      color: COLOR_MAP[label] ?? "#888",
    }))
    .sort((a, b) => b.pct - a.pct);
}

export default function SecuritiesPage() {
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [activeCategory, setActiveCategory] = useState("Total");
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [loading, setLoading] = useState(true);
  const [performance, setPerformance] = useState<PerformanceData | null>(null);

  useEffect(() => {
    if (sessionStorage.getItem("dnb_auth") === "1") setAuthed(true);
    setChecking(false);
  }, []);

  useEffect(() => {
    if (!authed) return;
    fetch("/api/holdings-with-history")
      .then((r) => r.json())
      .then((data: any[]) => setHoldings(data))
      .finally(() => setLoading(false));
  }, [authed]);

  useEffect(() => {
    // GitHub raw URL에서 performance.json 로드
    fetch(
      "https://raw.githubusercontent.com/jtkimpr/finance-watch/main/data/performance.json",
      { cache: "no-store" }
    )
      .then((r) => r.json())
      .then((data: PerformanceData) => setPerformance(data))
      .catch(() => setPerformance(null));
  }, []);

  const filtered = activeCategory === "Total"
    ? holdings
    : holdings.filter((h) => h.category === activeCategory);

  const totalKRW     = holdings.reduce((s, h) => s + h.valuation, 0);
  const filteredKRW  = filtered.reduce((s, h) => s + h.valuation, 0);
  const allocation   = computeAllocation(holdings);

  if (checking) return null;
  if (!authed) return <PasswordGate onAuth={() => setAuthed(true)} />;

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: "40vh" }}>
        <p style={{ color: "#60606a", fontSize: 14 }}>데이터를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl">
      {/* 핵심 지표 */}
      <div className="grid grid-cols-2 gap-0 mb-0" style={{ borderBottom: "1px dashed #28282e" }}>
        <div className="py-8 px-0 pr-8" style={{ borderRight: "1px dashed #28282e" }}>
          <p className="text-xs uppercase tracking-widest mb-3" style={{ color: "#60606a" }}>총 평가금액</p>
          <p className="text-4xl font-bold" style={{ color: "#f0f0ee" }}>
            ₩{Math.round(totalKRW).toLocaleString()}
          </p>
          <p className="text-sm mt-2" style={{ color: "#60606a" }}>
            약 {(totalKRW / 100000000).toFixed(1)}억원
          </p>
        </div>
        <div className="py-8 px-8">
          <p className="text-xs uppercase tracking-widest mb-3" style={{ color: "#60606a" }}>성과 (총 평가금액 증감률)</p>
          <div className="flex flex-wrap gap-x-6 gap-y-2 mt-1">
            {performance ? (
              <>
                {[
                  { label: "60일전", value: performance.changes.day_60 },
                  { label: "30일전", value: performance.changes.day_30 },
                  { label: "7일전", value: performance.changes.day_7 },
                  { label: "1일전", value: performance.changes.day_1 },
                ].map((item) => (
                  <div key={item.label} className="flex flex-col gap-1">
                    <span style={{ color: "#60606a", fontSize: 12 }}>{item.label}</span>
                    <span className="font-bold text-lg" style={{
                      color: item.value === null ? "#60606a" : item.value > 0 ? "#4ade80" : "#ef4444"
                    }}>
                      {item.value === null ? "—" : `${item.value > 0 ? "+" : ""}${item.value.toFixed(2)}%`}
                    </span>
                  </div>
                ))}
              </>
            ) : (
              <span style={{ color: "#60606a", fontSize: 13 }}>데이터 로딩 중...</span>
            )}
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
        <div className="flex flex-wrap gap-x-8 gap-y-2">
          {allocation.map((a) => (
            <div key={a.label} className="flex items-center gap-2 text-sm">
              <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0" style={{ background: a.color }} />
              <span style={{ color: "#8a8a92" }}>{a.label}</span>
              <span className="font-bold" style={{ color: "#f0f0ee" }}>{a.pct.toFixed(2)}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* 카테고리 필터 */}
      <div className="flex flex-wrap gap-2 py-6">
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat;
          const catColor = cat === "Total" ? "#d4a853" : (CATEGORY_COLOR[cat] ?? "#d4a853");
          return (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className="px-4 py-1.5 rounded-full text-sm transition-all"
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
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "#141416", borderBottom: "1px solid #28282e" }}>
              <th className="px-3 py-3 text-left font-medium whitespace-nowrap"
                style={{ color: "#60606a", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                종목명
              </th>
              <th className="hidden sm:table-cell px-3 py-3 text-right font-medium whitespace-nowrap"
                style={{ color: "#60606a", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                평가금액 (KRW)
              </th>
              <th className="px-3 py-3 text-right font-medium whitespace-nowrap"
                style={{ color: "#60606a", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                현재가
              </th>
              <th className="hidden lg:table-cell px-3 py-3 text-right font-medium whitespace-nowrap"
                style={{ color: "#60606a", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                증감율 (60d · 30d · 7d · 1d)
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((h, i) => {
              const catColor = CATEGORY_COLOR[h.category] ?? "#f0f0ee";
              const CHANGES = h.price_changes ? [
                { label: "60d", value: h.price_changes.day_60 },
                { label: "30d", value: h.price_changes.day_30 },
                { label: "7d",  value: h.price_changes.day_7 },
                { label: "1d",  value: h.price_changes.day_1 },
              ] : [];
              return (
                <tr key={`${h.ticker}-${i}`}
                  style={{
                    borderBottom: "1px solid #1e1e24",
                    background: i % 2 === 0 ? "#0c0c0e" : "#111113",
                    transition: "background-color 0.15s"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#1a1a1f"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = i % 2 === 0 ? "#0c0c0e" : "#111113"}
                >
                  {/* 종목명 — 카테고리 색으로 표시 */}
                  <td className="px-3 py-3 font-medium">
                    <div className="whitespace-nowrap" style={{ color: catColor }}>{h.name}</div>
                    {h.exchange !== "—" && (
                      <span className="text-xs" style={{ color: "#60606a" }}>{h.ticker} · {h.exchange}</span>
                    )}
                  </td>

                  {/* 평가금액 — sm 이상에서 별도 컬럼, 모바일에서는 숨김 */}
                  <td className="hidden sm:table-cell px-3 py-3 text-right font-medium whitespace-nowrap"
                    style={{ color: h.valuation === 0 ? "#60606a" : "#f0f0ee" }}>
                    {h.valuation === 0 ? "—" : `₩${Math.round(h.valuation).toLocaleString()}`}
                  </td>

                  {/* 현재가 — 항상 표시. 화면 크기에 따라 하위 정보를 함께 표시 */}
                  <td className="px-3 py-3 text-right">
                    {/* 모바일 전용: 평가금액 (3줄 중 1번째) */}
                    <div className="sm:hidden text-xs font-medium mb-1"
                      style={{ color: h.valuation === 0 ? "#60606a" : "#a0a0a8" }}>
                      {h.valuation === 0 ? "—" : `₩${Math.round(h.valuation).toLocaleString()}`}
                    </div>
                    {/* 현재가 */}
                    <div className="font-medium whitespace-nowrap" style={{ color: "#f0f0ee" }}>
                      {h.ticker === "KRW" ? "₩1" : h.ticker === "USD" ? "$1.00" : formatPrice(h.price, h.currency)}
                    </div>
                    {/* sm~lg 사이(태블릿/중간 화면): 현재가 아래에 증감율 표시 */}
                    {CHANGES.length > 0 && (
                      <div className="lg:hidden flex justify-end flex-wrap gap-x-2 gap-y-0 text-xs mt-1">
                        {CHANGES.map((item) => (
                          <span key={item.label} style={{
                            color: item.value === null ? "#60606a" : item.value > 0 ? "#4ade80" : "#ef4444"
                          }}>
                            {item.value === null ? "—" : `${item.value > 0 ? "+" : ""}${item.value.toFixed(1)}%`}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>

                  {/* 증감율 — lg 이상에서 별도 컬럼 */}
                  <td className="hidden lg:table-cell px-3 py-3 text-right">
                    {CHANGES.length > 0 && (
                      <div className="flex justify-end gap-3 text-xs">
                        {CHANGES.map((item) => (
                          <span key={item.label} style={{
                            color: item.value === null ? "#60606a" : item.value > 0 ? "#4ade80" : "#ef4444"
                          }}>
                            {item.value === null ? "—" : `${item.value > 0 ? "+" : ""}${item.value.toFixed(1)}%`}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ background: "#1a1a1e", borderTop: "1px solid #28282e" }}>
              <td className="px-3 py-3 font-semibold" style={{ color: "#d4a853" }}>합계</td>
              <td className="hidden sm:table-cell px-3 py-3 text-right font-bold" style={{ color: "#d4a853" }}>
                ₩{Math.round(filteredKRW).toLocaleString()}
              </td>
              <td className="sm:hidden px-3 py-3 text-right font-bold" style={{ color: "#d4a853" }}>
                ₩{Math.round(filteredKRW).toLocaleString()}
              </td>
              <td className="hidden lg:table-cell"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
