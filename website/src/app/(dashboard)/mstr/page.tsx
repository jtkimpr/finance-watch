'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { createChart, IChartApi, ColorType, LineStyle, UTCTimestamp } from 'lightweight-charts';

// ── 상수 ──────────────────────────────────────
const TICKERS = ['btc', 'mstr', 'strf', 'strk', 'strc', 'strd'] as const;
type Ticker = typeof TICKERS[number] | 'mnav';

const COLORS: Record<Ticker, string> = {
  mnav: '#facc15',
  btc:  '#f7931a',
  mstr: '#ff6b35',
  strf: '#2196f3',
  strk: '#a855f7',
  strc: '#4caf50',
  strd: '#e91e63',
};

const LABELS: Record<Ticker, string> = {
  mnav: 'mNAV',
  btc:  'BTC',
  mstr: 'MSTR',
  strf: 'STRF',
  strk: 'STRK',
  strc: 'STRC',
  strd: 'STRD',
};

const CHART_OPTIONS = {
  layout: {
    background: { type: ColorType.Solid, color: '#1e222d' },
    textColor: '#787b86',
  },
  grid: {
    vertLines: { color: '#2a2e39' },
    horzLines: { color: '#2a2e39' },
  },
  timeScale: { borderColor: '#2a2e39', timeVisible: true },
  rightPriceScale: { borderColor: '#2a2e39' },
  crosshair: { mode: 1 },
  handleScroll: false,
  handleScale: false,
};

// ── 타입 ──────────────────────────────────────
interface DataPoint { time: string; value: number; }

interface ConfigInfo {
  btcHoldings: string;
  mstrShares: string;
  mstrDebt: string;
  lastDate: string;
}

interface CardInfo {
  key: Ticker;
  price: string;
  change: string;
  pct: string;
  dir: 'up' | 'down' | 'flat';
}

// ── CSV 로드 ──────────────────────────────────
const RAW_BASE = 'https://raw.githubusercontent.com/jtkimpr/finance-watch/main/data/strategy';

async function loadCSV(name: string): Promise<DataPoint[]> {
  const res = await fetch(`${RAW_BASE}/${name}.csv`, { cache: 'no-store' });
  const text = await res.text();
  return text.trim().split('\n').slice(1)
    .filter(l => l.trim())
    .map(l => {
      const [date, val] = l.split(',');
      return { time: date.trim(), value: parseFloat(val.trim()) };
    })
    .filter(d => !isNaN(d.value));
}

function getStepValue(history: DataPoint[], date: string): number {
  let val = history[0].value;
  for (const e of history) {
    if (e.time <= date) val = e.value;
    else break;
  }
  return val;
}

function calcMNAV(
  mstrData: DataPoint[],
  btcData: DataPoint[],
  holdingsHist: DataPoint[],
  sharesHist: DataPoint[],
  debtHist: DataPoint[],
): DataPoint[] {
  const btcMap: Record<string, number> = {};
  btcData.forEach(d => { btcMap[d.time] = d.value; });
  return mstrData
    .filter(d => btcMap[d.time])
    .map(d => {
      const btcNav = getStepValue(holdingsHist, d.time) * btcMap[d.time];
      const debt   = getStepValue(debtHist, d.time);
      const netNav = btcNav - debt;
      if (netNav <= 0) return null;
      return {
        time: d.time,
        value: parseFloat(((d.value * getStepValue(sharesHist, d.time)) / netNav).toFixed(4)),
      };
    })
    .filter((d): d is DataPoint => d !== null);
}

function normalize(data: DataPoint[]): DataPoint[] {
  if (!data || data.length === 0) return [];
  const base = data[0].value;
  return data.map(d => ({ time: d.time, value: parseFloat(((d.value / base) * 100).toFixed(4)) }));
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ── 메인 컴포넌트 ─────────────────────────────
export default function MstrPage() {
  const [config, setConfig] = useState<ConfigInfo | null>(null);
  const [cards, setCards] = useState<CardInfo[]>([]);
  const [curMNAV, setCurMNAV] = useState<string>('—');
  const [error, setError] = useState<string | null>(null);
  const [activeRange, setActiveRange] = useState<string>('Max');
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); return () => setMounted(false); }, []);

  const RANGE_BUTTONS = [
    { label: 'Max', days: null },
    { label: '1y',  days: 365 },
    { label: '6m',  days: 182 },
    { label: '3m',  days: 91  },
    { label: '1m',  days: 30  },
    { label: '7d',  days: 7   },
  ];

  const applyRange = useCallback((label: string, days: number | null) => {
    setActiveRange(label);
    const charts = chartsRef.current;
    if (!charts.length) return;
    if (days === null) {
      charts.forEach(c => c.timeScale().fitContent());
    } else {
      const lastTime = lastTimeRef.current || Math.floor(Date.now() / 1000);
      const to   = (lastTime + 86400 * 3) as UTCTimestamp;  // 최신 데이터 오른쪽에 약간 여백
      const from = (lastTime - days * 86400) as UTCTimestamp;
      charts.forEach(c => c.timeScale().setVisibleRange({ from, to }));
    }
  }, []);

  const normRef  = useRef<HTMLDivElement>(null);
  const mnavRef  = useRef<HTMLDivElement>(null);
  const btcRef   = useRef<HTMLDivElement>(null);
  const mstrRef  = useRef<HTMLDivElement>(null);
  const strfRef  = useRef<HTMLDivElement>(null);
  const strkRef  = useRef<HTMLDivElement>(null);
  const strcRef  = useRef<HTMLDivElement>(null);
  const strdRef  = useRef<HTMLDivElement>(null);

  const chartsRef    = useRef<IChartApi[]>([]);
  const lastTimeRef  = useRef<number>(0);

  useEffect(() => {
    function makeChart(el: HTMLDivElement, height: number): IChartApi {
      const chart = createChart(el, {
        ...CHART_OPTIONS,
        width: el.clientWidth,
        height,
      });
      const handleResize = () => chart.applyOptions({ width: el.clientWidth });
      window.addEventListener('resize', handleResize);
      chartsRef.current.push(chart);
      return chart;
    }

    async function init() {
      try {
        const dataMap: Partial<Record<typeof TICKERS[number], DataPoint[]>> = {};
        await Promise.all(TICKERS.map(async t => { dataMap[t] = await loadCSV(t); }));
        const holdingsHist = await loadCSV('btc_holdings');
        const sharesHist   = await loadCSV('mstr_shares');
        const debtHist     = await loadCSV('mstr_debt');

        // config 표시
        const lh = holdingsHist[holdingsHist.length - 1];
        const ls = sharesHist[sharesHist.length - 1];
        const ld = debtHist[debtHist.length - 1];
        const btcArr = dataMap['btc']!;

        setConfig({
          btcHoldings: lh.value.toLocaleString('en-US') + ' BTC  (' + lh.time + ')',
          mstrShares:  ls.value.toLocaleString('en-US') + '주  (' + ls.time + ')',
          mstrDebt:    '$' + (ld.value / 1e9).toFixed(2) + 'B  (' + ld.time + ')',
          lastDate:    btcArr[btcArr.length - 1]?.time ?? '—',
        });

        // 최신 데이터 타임스탬프 저장 (버튼 range 기준)
        const lastTimeStr = btcArr[btcArr.length - 1]?.time ?? '';
        lastTimeRef.current = lastTimeStr ? Math.floor(new Date(lastTimeStr).getTime() / 1000) : Math.floor(Date.now() / 1000);

        // mNAV 계산
        const mnavData = calcMNAV(dataMap['mstr']!, btcArr, holdingsHist, sharesHist, debtHist);

        // 가격 카드
        const newCards: CardInfo[] = [];

        // mNAV 카드
        if (mnavData.length > 0) {
          const cur  = mnavData[mnavData.length - 1].value;
          const prev = mnavData.length > 1 ? mnavData[mnavData.length - 2].value : cur;
          const diff = cur - prev;
          const pct  = ((diff / prev) * 100).toFixed(2);
          newCards.push({
            key: 'mnav',
            price: cur.toFixed(3) + 'x',
            change: diff > 0 ? '▲' : diff < 0 ? '▼' : '—',
            pct: Math.abs(parseFloat(pct)).toFixed(2) + '%',
            dir: diff > 0 ? 'up' : diff < 0 ? 'down' : 'flat',
          });
        }

        for (const ticker of TICKERS) {
          const data = dataMap[ticker];
          if (!data || data.length === 0) continue;
          const last  = data[data.length - 1].value;
          const prev  = data.length > 1 ? data[data.length - 2].value : last;
          const diff  = last - prev;
          const pct   = ((diff / prev) * 100).toFixed(2);
          const price = ticker === 'btc'
            ? '$' + last.toLocaleString('en-US', { maximumFractionDigits: 0 })
            : '$' + last.toFixed(2);
          newCards.push({
            key: ticker,
            price,
            change: diff > 0 ? '▲' : diff < 0 ? '▼' : '—',
            pct: Math.abs(parseFloat(pct)).toFixed(2) + '%',
            dir: diff > 0 ? 'up' : diff < 0 ? 'down' : 'flat',
          });
        }
        setCards(newCards);

        // mNAV 현재값
        const curMnavVal = mnavData[mnavData.length - 1]?.value ?? 0;
        setCurMNAV(`현재 ${curMnavVal.toFixed(3)}x`);

        // ── mNAV 차트 ──
        if (mnavRef.current) {
          const mc = makeChart(mnavRef.current, 320);
          mc.addLineSeries({
            color: COLORS.mnav, lineWidth: 2,
            priceFormat: { type: 'price', precision: 3, minMove: 0.001 },
          }).setData(mnavData);
          mc.addLineSeries({
            color: '#4b5563', lineWidth: 1, lineStyle: LineStyle.Dashed,
            priceFormat: { type: 'price', precision: 3, minMove: 0.001 },
          }).setData(mnavData.map(d => ({ time: d.time, value: 1.0 })));
          mc.timeScale().fitContent();
        }

        // ── 개별 가격 차트 ──
        const smallConfigs: { ref: React.RefObject<HTMLDivElement | null>; ticker: typeof TICKERS[number]; area: boolean }[] = [
          { ref: btcRef,  ticker: 'btc',  area: true },
          { ref: mstrRef, ticker: 'mstr', area: true },
          { ref: strfRef, ticker: 'strf', area: false },
          { ref: strkRef, ticker: 'strk', area: false },
          { ref: strcRef, ticker: 'strc', area: false },
          { ref: strdRef, ticker: 'strd', area: false },
        ];

        smallConfigs.forEach(({ ref, ticker, area }) => {
          const data = dataMap[ticker];
          if (!data || !data.length || !ref.current) return;
          const c = makeChart(ref.current, 240);
          const color = COLORS[ticker];
          if (area) {
            c.addAreaSeries({
              lineColor: color,
              topColor: hexToRgba(color, 0.3),
              bottomColor: hexToRgba(color, 0.0),
              lineWidth: 2,
            }).setData(data);
          } else {
            c.addLineSeries({ color, lineWidth: 2 }).setData(data);
          }
          c.timeScale().fitContent();
        });

      } catch (e) {
        setError('데이터 로딩 실패: ' + String(e));
      }
    }

    init();

    return () => {
      chartsRef.current.forEach(c => c.remove());
      chartsRef.current = [];
    };
  }, []);

  const dirColor = (dir: CardInfo['dir']) =>
    dir === 'up' ? '#26a69a' : dir === 'down' ? '#ef5350' : '#787b86';

  return (
    <div className="flex flex-col h-full" style={{ marginTop: '-2rem' }}>
      {/* 대시보드 본문 */}
      <div
        style={{
          color: '#d1d4dc',
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          fontSize: 14,
          flex: 1,
          paddingTop: '20px',
        }}
      >
        {/* 기간 선택 버튼 → navbar 중앙 슬롯에 포털로 주입 */}
        {mounted && document.getElementById('navbar-center') && createPortal(
          <div style={{ display: 'flex', gap: 5 }}>
            {RANGE_BUTTONS.map(({ label, days }) => (
              <button
                key={label}
                onClick={() => applyRange(label, days)}
                style={{
                  padding: '3px 11px',
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 600,
                  border: '1px solid',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  background: activeRange === label ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.10)',
                  color:      activeRange === label ? '#fff' : 'rgba(0,0,0,0.55)',
                  borderColor: activeRange === label ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.15)',
                }}
              >
                {label}
              </button>
            ))}
          </div>,
          document.getElementById('navbar-center')!
        )}

        {error ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#ef5350' }}>{error}</div>
        ) : (
          <>
            {/* mNAV 계산 기준 */}
            <section style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#787b86', marginBottom: 12 }}>
                mNAV 계산 기준
              </div>
              <div style={{
                display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap',
                background: '#1e222d', border: '1px solid #2a2e39',
                borderRadius: 8, padding: '12px 16px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, color: '#787b86', whiteSpace: 'nowrap' }}>BTC 보유량</span>
                  <span style={{ color: '#d1d4dc', fontSize: 13 }}>{config?.btcHoldings ?? '—'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, color: '#787b86', whiteSpace: 'nowrap' }}>MSTR 발행주식수</span>
                  <span style={{ color: '#d1d4dc', fontSize: 13 }}>{config?.mstrShares ?? '—'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, color: '#787b86', whiteSpace: 'nowrap' }}>총 금융부채</span>
                  <span style={{ color: '#ef5350', fontSize: 13 }}>{config?.mstrDebt ?? '—'}</span>
                </div>
              </div>
            </section>

            {/* 가격 카드 */}
            <section style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#787b86', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
                현재 가격
              </div>
              {cards.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#787b86' }}>로딩 중...</div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 12,
                }}>
                  {cards.filter(c => ['mnav', 'btc', 'mstr', 'strc'].includes(c.key)).map(card => (
                    <div key={card.key} style={{
                      background: '#1e222d',
                      border: card.key === 'mnav' ? '1px solid rgba(245,158,11,0.4)' : '1px solid #2a2e39',
                      borderRadius: 8,
                      padding: '14px 16px',
                    }}>
                      <div style={{ fontSize: 'clamp(10px, 1.1vw, 11px)', fontWeight: 700, color: COLORS[card.key], letterSpacing: 1 }}>
                        {LABELS[card.key]}
                      </div>
                      <div style={{ fontSize: 'clamp(16px, 2.2vw, 20px)', fontWeight: 600, color: '#fff', margin: '6px 0 4px' }}>
                        {card.price}
                      </div>
                      <div style={{ fontSize: 'clamp(11px, 1.3vw, 12px)', fontWeight: 500, color: dirColor(card.dir) }}>
                        {card.change} {card.pct}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* mNAV 차트 */}
            <section style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#787b86', marginBottom: 12 }}>
                mNAV (MSTR 프리미엄)
              </div>
              <div style={{ background: '#1e222d', border: '1px solid #2a2e39', borderRadius: 8, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px 8px', borderBottom: '1px solid #2a2e39' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#d1d4dc' }}>mNAV = MSTR 시총 ÷ (BTC 보유량 × BTC 가격 − 총 금융부채)</span>
                  <span style={{ fontSize: 11, color: '#787b86' }}>{curMNAV}</span>
                </div>
                <div ref={mnavRef} style={{ width: '100%' }} />
                <div style={{ padding: '6px 16px 10px', fontSize: 11, color: '#787b86' }}>참고: 역사적 범위 약 1.5x ~ 3.5x</div>
              </div>
            </section>

            {/* 개별 가격 차트 */}
            <section>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#787b86', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
                개별 가격 차트
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                {[
                  { ref: btcRef,  title: 'BTC'  },
                  { ref: mstrRef, title: 'MSTR' },
                  { ref: strfRef, title: 'STRF' },
                  { ref: strkRef, title: 'STRK' },
                  { ref: strcRef, title: 'STRC' },
                  { ref: strdRef, title: 'STRD' },
                ].map(({ ref, title }) => (
                  <div key={title} style={{ background: '#1e222d', border: '1px solid #2a2e39', borderRadius: 8, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px 8px', borderBottom: '1px solid #2a2e39' }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#d1d4dc' }}>{title}</span>
                      <span style={{ fontSize: 11, color: '#787b86' }}>USD</span>
                    </div>
                    <div ref={ref} style={{ width: '100%' }} />
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
