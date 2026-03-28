# Dirac & Broglie Website — 프로젝트 문서

## 프로젝트 개요

| 항목 | 내용 |
|---|---|
| 목적 | 가족법인(부동산·유가증권 투자) 내부 관리 포털 |
| 성격 | 외부 홍보용 아님 — 가족 구성원·관련 전문가 전용 비공개 포털 |
| URL | https://diracbroglie.vercel.app |
| 레포 | https://github.com/jtkimpr/finance-watch (`website/` 폴더) |
| 호스팅 | Vercel (Hobby 무료 플랜) |
| 배포 방식 | `main` 브랜치 push → Vercel 자동 빌드 (website/ 변경분만 트리거) |

---

## 기술 스택

| 항목 | 내용 |
|---|---|
| 프레임워크 | Next.js 15 (App Router, TypeScript) |
| 스타일 | Tailwind CSS |
| 인증 | 클라이언트 사이드 비밀번호 (sessionStorage 기반) |
| 데이터 소스 | GitHub Raw URL (`jtkimpr/finance-watch/main/data/*.json`) |
| 배포 트리거 | `vercel.json` ignoreCommand: `! git diff HEAD^ HEAD --quiet -- website/` |

---

## 네비게이션 구조

상단 오렌지 고정 바 (`#FA660F`) — 모든 페이지 공통

```
Dirac & Broglie  |  Company  |  Family  |  STRC  |  👤
(로고 / 홈)                                          (Admin)
```

- **모바일**: 로고 아래로 메뉴 줄바꿈 (flex-wrap)
- **로고 폰트**: `clamp(18px, 5vw, 26px)`
- **Admin 아이콘**: 비밀번호 변경 + 세션 잠금 모달

---

## 페이지 구성

### `/about` — Company
법인 소개 페이지. 비밀번호 보호 없음.

### `/family` — Family ⭐
비밀번호 보호 (`980612` 기본값, Admin에서 변경 가능).

**탭 구성**:
```
Total  |  Dirac & Broglie  |  Susie  |  Jintae  |  Hyunhee
```

| 탭 | 컴포넌트 | 설명 |
|---|---|---|
| Total | `TotalView` | 전체 합계 + 개인별 현황 + 카테고리 비중 바 비교 |
| Dirac & Broglie | `DiracBroglieView` | 법인 포트폴리오 — Investments 페이지와 동일한 UI |
| Susie / Jintae / Hyunhee | `MemberView` | 개인별 포트폴리오 |

탭 바는 모바일에서 가로 스크롤 (`overflow-x-auto`, `whiteSpace: nowrap`).

### `/securities` — (구) Investments
직접 URL 접근 시 여전히 유효하나, 네비게이션에는 없음. `Dirac & Broglie` 탭과 동일한 데이터/UI.

### `/mstr` — STRC
MicroStrategy 관련 페이지. 네비게이션 중앙 슬롯(`#navbar-center`)에 포털로 콘텐츠 주입 가능.

---

## 데이터 플로우

```
GitHub Actions (하루 4회 KST 00:10 / 09:10 / 12:10 / 16:10)
  └─ update_watchlist.py 실행
       ├─ watchlist.xlsx 업데이트 (price/volume)
       ├─ portfolio.json 생성 → data/ 커밋
       ├─ price-history.json 생성 → data/ 커밋
       └─ performance.json 생성 → data/ 커밋

Vercel (서버리스 API Routes)
  ├─ /api/holdings-with-history
  │     portfolio.json["Dirac & Broglie"] + price-history.json 병합
  │     → 각 holding에 price_changes: {day_1, day_7, day_30, day_60} 추가
  ├─ /api/family?member=Susie|Jintae|Hyunhee
  │     portfolio.json[member] + price-history.json 병합
  │     → 각 holding에 price_changes 추가
  └─ /api/family-total
        portfolio.json 전 멤버 합산 + 카테고리별 비중 계산

클라이언트 (브라우저)
  ├─ Dirac & Broglie 탭: /api/holdings-with-history 호출
  │     + performance.json → members["D&B"].changes (헤더 수익률)
  ├─ 개인 탭 (Susie/Jintae/Hyunhee): /api/family?member=xxx 호출
  │     + performance.json → members[member].changes (헤더 수익률)
  └─ Total 탭: /api/family-total 호출
        + performance.json → members.Total.changes + 각 멤버 changes
```

### 데이터 파일 위치 (GitHub Raw)

| 파일 | URL |
|---|---|
| portfolio.json | `https://raw.githubusercontent.com/jtkimpr/finance-watch/main/data/portfolio.json` |
| price-history.json | `https://raw.githubusercontent.com/jtkimpr/finance-watch/main/data/price-history.json` |
| performance.json | `https://raw.githubusercontent.com/jtkimpr/finance-watch/main/data/performance.json` |

### portfolio.json 구조

```json
{
  "Dirac & Broglie": [ { holding... }, ... ],
  "Susie":           [ { holding... }, ... ],
  "Jintae":          [ { holding... }, ... ],
  "Hyunhee":         [ { holding... }, ... ],
  "_prev_totals": {
    "Dirac & Broglie": 1234567890,
    "Susie": ...,
    "Jintae": ...,
    "Hyunhee": ...
  }
}
```

### Holding 객체 구조

```typescript
interface Holding {
  name: string;        // 종목명
  ticker: string;      // 티커
  exchange: string;    // 거래소 ("—" 이면 서브텍스트 숨김)
  category: string;    // 자산 카테고리
  currency: string;    // "KRW" | "USD"
  qty: number;
  price: number;
  valuation: number;   // KRW 환산 평가금액
  price_changes?: {    // holdings-with-history에서 추가됨
    day_1: number | null;
    day_7: number | null;
    day_30: number | null;
    day_60: number | null;
  };
}
```

### performance.json 구조

```typescript
interface MemberPerf {
  current: number | null;
  changes: {
    day_1: number | null;    // 1일 수익률 (%)
    day_7: number | null;    // 7일 수익률 (%)
    day_30: number | null;   // 30일 수익률 (%)
    day_60: number | null;   // 60일 수익률 (%)
  };
}

interface PerformanceData {
  date: string;              // 기준일 (YYYY-MM-DD)
  members: {
    Total:   MemberPerf;    // Summary 시트 B열 (전체 합산)
    "D&B":   MemberPerf;    // Summary 시트 D열 (Dirac & Broglie)
    Susie:   MemberPerf;    // Summary 시트 C열
    Jintae:  MemberPerf;    // Summary 시트 E열
    Hyunhee: MemberPerf;    // Summary 시트 F열
  };
}
```

> **이전 구조** (`date`, `current`, `changes` 최상위 flat 구조)는 2026-03-28에 `members` 구조로 대체되었음.

---

## UI 컴포넌트 설계

### Family 페이지 탭별 레이아웃

#### Total 탭 (`TotalView`)

```
① 총 평가금액(60D-30D-7D-1D)          ← performance.json members.Total
   ₩5,742,722,488
   +0.14%  +0.19%  -1.10%  -0.15%

② D&B(60D-30D-7D-1D)  │  Susie(60D-30D-7D-1D)    ← 2×2 그리드
   ₩4,095,573,863      │  ₩571,891,809              performance.json
   +2.10% +0.40% ...   │  -9.74% -0.66% ...        members[member]
   ─────────────────────────────────────
   Jintae(60D-30D-7D-1D) │  Hyunhee(60D-30D-7D-1D)
   ₩842,764,769          │  ₩232,492,047

③ 자산 카테고리별 비중 (SVG 도넛 파이차트 5개)
   Total / Dirac & Broglie / Susie / Jintae / Hyunhee
   중앙: 총액(억원), 하단: 카테고리별 비중(%)
```

#### Dirac & Broglie 탭 / 개인 탭 (`DiracBroglieView` / `MemberView`)

```
① 총 평가금액(60D-30D-7D-1D)          ← performance.json members["D&B"] 또는 members[member]
   ₩4,095,573,863
   +2.10%  +0.40%  -1.02%  -0.03%

② 자산 카테고리별 비중 (가로 비중 바)

③ 카테고리 필터 버튼

④ 종목 테이블
   종목명(60D-30D-7D-1D) │ 현재가 │ 평가금액
   QQQM                  │        │
   -10.1% -6.9% -2.5% -1.1%  ← price_changes 서브행 (price-history.json)
   ...
   합계                  │        │ ₩XXX
```

### 자산 카테고리 색상 시스템

| 카테고리 | 색상 | 용도 |
|---|---|---|
| Crypto | `#f97316` | 종목명 텍스트, 필터 버튼, 비중 도트 |
| Cash | `#4ade80` | 동일 |
| Gold | `#d4a853` | 동일 (Total 필터 버튼도 동일 색) |
| Kor Stock | `#60a5fa` | 동일 |
| US Stock | `#a78bfa` | 동일 |
| US Bonds | `#f472b6` | 동일 |

### 자산 카테고리 표시 순서

`Crypto → Cash → Gold → Kor Stock → US Stock → US Bonds`
(computeAllocation `ORDER` 배열 기준)

### KPI 섹션 레이아웃

```
모바일 (< sm):               데스크탑 (≥ sm):
┌─────────────────┐          ┌──────────┬──────────┐
│  총 평가금액     │          │ 총평가금액│60D 30D   │
│  ₩XXX억         │          │ ₩XXX억   │7D  1D    │
├─────────────────┤          └──────────┴──────────┘
│  60D  30D  7D  1D│
└─────────────────┘
```

- 구분선: `border-style: dashed`, 모바일 가로선 → 데스크탑 세로선 (`border-b sm:border-b-0 sm:border-r`)
- 퍼포먼스 항목: 모바일 `flex-1` 균등 배치, 데스크탑 `flex-none`

### 자산 비중 섹션

- 가로 비중 바: `h-2 rounded-full` + 각 카테고리 색 width%
- 비중 범례: 컬러 도트 + 퍼센트 숫자만 표시 (레이블 없음, `title` 속성으로 툴팁)

### 카테고리 필터 버튼

- 활성 상태: `background: ${catColor}22`, `color: catColor`, `borderColor: catColor`
- 비활성 상태: `background: #1a1a1e`, `color: ${catColor}99`, `borderColor: ${catColor}44`
- Total 버튼 색: `#d4a853`

### 테이블 구조

`table-layout: auto` 적용, 3컬럼.

| 컬럼 | 정렬 | 내용 |
|---|---|---|
| 종목명(60D-30D-7D-1D) | 좌 | 종목명 (카테고리 색) |
| 현재가 | 우 | KRW/USD 가격 |
| 평가금액 | 우 | KRW 환산 평가금액 |

**2-행 패턴** (종목마다 메인 행 + 수익률 서브행):
```
┌─────────────────────────────┬──────────┬──────────────────┐
│ QQQM                        │  $481.89 │ ₩276,429,300     │
├─────────────────────────────┴──────────┴──────────────────┤
│ -10.1%  -6.9%  -2.5%  -1.1%                              │
└──────────────────────────────────────────────────────────┘
```

- 종목명: 카테고리 색, ticker/코드 제거
- 수익률 서브행: `price_changes` 기반 (60D→30D→7D→1D 순), null이면 `—`
- 수익률 색: 양수 `#4ade80` (초록), 음수 `#ef4444` (빨강), null `#60606a` (회색)
- 합계 행: 3번째 컬럼(평가금액)에 표시

---

---

## 스크립트 (`scripts/`)

| 파일 | 역할 | 출력 |
|---|---|---|
| `generate_performance.py` | watchlist.xlsx Summary 시트 → 멤버별 60D/30D/7D/1D 수익률 | `data/performance.json` |
| `generate_price_history.py` | watchlist.xlsx Price 시트 → 종목별 현재가 + 기간별 변동률 | `data/price-history.json` |
| `generate_portfolio_json.py` | watchlist.xlsx Info 시트 → 보유 종목 JSON | `data/portfolio.json` |
| `update_holdings.py` | 보유 수량/단가 업데이트 | watchlist.xlsx 수정 |
| `update_prices.py` | 시장 가격 수집 (Yahoo Finance 등) | watchlist.xlsx 수정 |
| `pull_sync.sh` | GitHub 최신 pull + 스크립트 순차 실행 | — |

### Price 시트 컬럼명 → ticker 매핑 규칙 (`generate_price_history.py`)

Price 시트 헤더가 ticker와 다를 경우 3단계 우선순위로 매핑:

1. **직접 일치**: 헤더 = ticker (예: `QQQM`, `423160`)
2. **Name 역매핑**: 헤더 = Info 시트 Name 컬럼 (예: `Bitcoin` → `BTC_USDT`)
3. **수동 폴백** (`MANUAL_HEADER_TO_TICKER`):
   ```python
   "Strategy Prf"   → "STRK"
   "Strategy Prf A" → "STRC"
   "Strategy Prf D" → "STRD"
   "Strategy Prf F" → "STRF"
   "USDT_KRW Upbit" → "USDT_KRW"
   "UB Care"        → "032620"
   "Strategy"       → "MSTR"
   ```
> 새 종목을 Price 시트에 다른 이름으로 추가할 경우 이 폴백 딕셔너리에 수동 추가 필요.

---

## 소스 파일 구조

```
website/
├── src/
│   ├── app/
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx          # 대시보드 레이아웃 (Navbar 포함)
│   │   │   ├── about/page.tsx      # Company 페이지
│   │   │   ├── family/page.tsx     # Family 페이지 (탭: Total/D&B/Susie/Jintae/Hyunhee)
│   │   │   ├── mstr/page.tsx       # STRC 페이지
│   │   │   └── securities/page.tsx # (구) Investments — 직접 URL 접근 가능
│   │   ├── api/
│   │   │   ├── holdings-with-history/route.ts  # D&B 포트폴리오 + 가격변동
│   │   │   ├── family/route.ts                 # 개인 포트폴리오 (?member=xxx)
│   │   │   ├── family-total/route.ts           # 전체 합산 + 비중
│   │   │   └── investments/route.ts            # (미사용 또는 구버전)
│   │   └── page.tsx                # 루트 → /about 리다이렉트
│   └── components/
│       └── layout/
│           └── Navbar.tsx          # 공통 네비게이션 바 + Admin 모달
└── vercel.json                     # ignoreCommand 설정
```

---

## 인증 구조

- **비밀번호**: `localStorage["dnb_password"]` 에 저장 (없으면 기본값 `980612` 사용)
- **세션**: 인증 성공 시 `sessionStorage["dnb_auth"] = "1"` 저장 → 탭 닫으면 해제
- **Admin 패널**: Admin 비밀번호(`localStorage["dnb_admin_password"]`, 기본값 이메일)로 진입 → 투자 비밀번호 변경 / 세션 잠금

---

## Vercel 배포 설정

```json
// website/vercel.json
{
  "ignoreCommand": "! git diff HEAD^ HEAD --quiet -- website/"
}
```

- `git diff`가 `website/` 변경 시 exit 1 → `!`로 반전 → exit 0 → Vercel 빌드
- `website/` 변경 없으면 exit 0 → `!` 반전 → exit 1 → Vercel 스킵

---

## 업데이트 이력

### 2026-03-28 (최신)

#### Family 페이지 전면 개편 (UI/UX)

**DiracBroglieView 헤더 변경**
- 2컬럼 그리드 (총 평가금액 + 퍼포먼스) → 단일 컬럼
- 레이블: `총 평가금액(60D-30D-7D-1D)`, 금액, 수익률 4개 1행
- 수익률 소스: `performance.json` → `members["D&B"].changes` (Summary 시트 D열)
- "약 41.0억원" 텍스트 제거

**DiracBroglieView 테이블 변경**
- 4컬럼 → 3컬럼: `종목명(60D-30D-7D-1D) | 현재가 | 평가금액`
- 종목 코드(ticker) 종목명 하단 표시 제거
- 종목별 수익률 서브행 추가: 60D · 30D · 7D · 1D (price-history.json 기반)
- 합계 위치: 3번째 컬럼(평가금액)으로 이동

**MemberView (Susie/Jintae/Hyunhee) 동일 적용**
- 헤더 동일 구조, 수익률 소스: `performance.json` → `members[member].changes`
- 테이블 동일 구조 (3컬럼 + 수익률 서브행)
- `/api/family`: `price-history.json` 병합 추가 (이전에는 `portfolio.json`만 반환)

**TotalView 전면 개편**
- ① Total 헤더: `총 평가금액(60D-30D-7D-1D)` + `members.Total.changes`
- ② 멤버별 서브헤더: D&B / Susie / Jintae / Hyunhee 2×2 그리드, 각각 금액 + 수익률 4개
- ③ 자산 카테고리별 비중: 가로 바 차트 → **SVG 도넛 파이차트 5개** (Total + 4 멤버)
  - 중앙에 총액(억원) 표시, 하단에 카테고리별 비중(%) 목록

#### 데이터 파이프라인 개선

**`generate_price_history.py` 전면 수정** (32/33 종목 수익률 복구, 이전 9/33)
- Info 시트 `Name → ticker` 역매핑 추가 (② 매핑 경로)
- `MANUAL_HEADER_TO_TICKER` 수동 폴백 추가 (③ 매핑 경로):
  - `Strategy Prf → STRK`, `Strategy Prf A → STRC`, `Strategy Prf D → STRD`
  - `Strategy Prf F → STRF`, `USDT_KRW Upbit → USDT_KRW`, `UB Care → 032620`, `Strategy → MSTR`
- row-offset 기반 날짜 계산 → **날짜 기반 series 매핑**으로 전환
  - 최대 200행 수집, 각 종목별 `(date, price)` 시리즈 구성
  - current = 가장 최신 날짜 유효값 (빈 행 무시)
  - day_1/7/30/60 = 현재 기준일 - N일에 가장 가까운 실제 거래일 (±5일 허용)

**`generate_performance.py` 구조 변경** (flat → members 구조)
- Summary 시트 A~F열 전체 파싱 (A=Date, B=Total, C=Susie, D=D&B, E=Jintae, F=Hyunhee)
- 출력: `{ date, members: { Total, "D&B", Susie, Jintae, Hyunhee } }` 형태
- 각 멤버별 60D/30D/7D/1D 변동률 독립 계산

---

### 2026-03-27

- **네비게이션 변경**: `Investments` 메뉴 제거 → `Company | Family | STRC | 아이콘`
- **Family 페이지 탭 추가**: `Dirac & Broglie` 탭 신설
  - `/securities` 페이지와 동일한 UI: 총 평가금액 + 60D/30D/7D/1D 성과, 자산 비중 바, 카테고리 필터, 가격변동률 테이블
  - `/api/holdings-with-history` + `performance.json` 데이터 사용
- **탭 바 모바일 대응**: `overflow-x-auto` + `whiteSpace: nowrap`으로 가로 스크롤

### 2026-03-27 (이전)

- **Securities / Family MemberView 통일**: 종목명 카테고리 색 표시, 비중 도트+숫자만, 카테고리 필터 색상 통일
- **자산 비중 순서 고정**: `Crypto→Cash→Gold→Kor Stock→US Stock→US Bonds`
- **KPI 섹션 리디자인**: 총 평가금액과 60D/30D/7D/1D를 좌우 분리 (모바일: 상하)
- **테이블 리디자인**: 구분 컬럼 제거, `table-layout: fixed`, 증감율 별도 컬럼(lg+) / 현재가 아래(sm-)
- **필터 버튼 색상**: 각 카테고리 고유 색으로 변경
- **반응형 네비게이션**: 모바일에서 메뉴 로고 아래 줄바꿈, 폰트 `clamp()`
- **Vercel ignoreCommand 버그 수정**: `!` 누락으로 배포가 계속 스킵되던 문제 해결

---

## 미결 / 향후 작업

- [ ] `/securities` 페이지 처리 방침 결정 (리다이렉트 또는 유지)
- [ ] 유가증권 보유 데이터 수동 업데이트 → 엑셀 업로드 방식 자동화 (현재는 watchlist.xlsx → GitHub Actions → portfolio.json 생성)
- [ ] 부동산 포트폴리오 페이지 구현
- [ ] 집 맥에어에서 GitHub 클론 동기화 확인
