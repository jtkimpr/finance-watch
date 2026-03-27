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
  ├─ /api/family?member=Susie|Jintae|Hyunhee
  │     portfolio.json[member] 반환
  └─ /api/family-total
        portfolio.json 전 멤버 합산 + 카테고리별 비중 계산

클라이언트 (브라우저)
  ├─ Dirac & Broglie 탭 / securities 페이지: /api/holdings-with-history 호출
  ├─ Dirac & Broglie 탭 / securities 페이지: performance.json GitHub Raw URL 직접 fetch
  ├─ 개인 탭 (Susie/Jintae/Hyunhee): /api/family?member=xxx 호출
  └─ Total 탭: /api/family-total 호출
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
```

---

## UI 컴포넌트 설계

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

`table-layout: fixed` 적용, 컬럼 너비 고정.

| 컬럼 | 너비 | 표시 조건 |
|---|---|---|
| 종목명 | 30% | 항상 |
| 평가금액 | 28% | 항상 |
| 현재가 | 나머지 | 항상 (소형 화면: 증감율도 2줄로 표시) |
| 60D · 30D · 7D · 1D | 34% | `lg` 이상만 (`hidden lg:table-cell`) |

- 종목명: 카테고리 색으로 표시, 넘치면 `truncate` (말줄임)
- 소형화면 증감율: `현재가` 셀 내에 `lg:hidden` div로 표시

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

### 2026-03-27 (최신)

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
