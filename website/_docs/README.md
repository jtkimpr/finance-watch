# dnb-website
Building new website for dirac & broglie

---

## 변경 이력

### 2026-03-28

#### 1. `/securities` 페이지 삭제
- `src/app/(dashboard)/securities/page.tsx` 파일 삭제
- `src/components/layout/Sidebar.tsx`에서 securities 메뉴 항목 제거

#### 2. Investments 페이지 (구 Family) — 개인 탭 UI 통일
- Susie / Jintae / Hyunhee 탭의 헤더를 Dirac & Broglie 탭과 동일한 구조로 변경
  - 우측 상단 수익률 카드 제거
  - 수익률(60D / 30D / 7D / 1D)을 헤더 내부로 통합
- 보유 종목 표에서 ticker 코드 표시 제거, 대신 가격 변동률(price_changes) 행 표시
  - 데이터 출처: `/api/family?member=X` → `price-history.json`의 `changes` 필드

#### 3. 헤더에서 "약 X억원" 텍스트 제거
- Total / Susie / Jintae / Hyunhee 탭 모두 적용

#### 4. 탭 상태 URL 쿼리 파라미터로 유지
- 새로고침 시 현재 탭 유지: `/family?tab=Susie` 형태
- `useSearchParams` 사용으로 인해 `Suspense` 경계 추가 (`FamilyPageContent` + `FamilyPage` 분리)

#### 5. STRC 페이지 정리
- 상단 "MSTR Preferred..." 헤더 제거
- 이중 배경 제거 (검은 배경 단일화)
- mNAV 계산 기준 레이블에서 부가 설명 텍스트 제거 ("(최신 공시)", "(최신)", "공시 이력 반영..." 등)
- 가격 카드 4개만 표시: mNAV, BTC, MSTR, STRC
- 성과 비교 섹션(그래프 포함) 전체 제거

#### 6. 상단 네비게이션 바 레이블 변경
- "Family" → "Investments" (`src/components/layout/Navbar.tsx`)

---

## 아키텍처 메모

- **데이터 소스**: GitHub Raw URL (`jtkimpr/finance-watch` 레포의 `data/` 폴더)
  - `portfolio.json` — 보유 종목 및 취득 단가
  - `price-history.json` — 현재가 및 기간별 등락률
  - `performance.json` — 법인 전체 수익률 (Dirac & Broglie 탭용)
- **API 라우트**
  - `/api/holdings-with-history` — Dirac & Broglie 포트폴리오
  - `/api/family?member=Susie|Jintae|Hyunhee` — 개인별 포트폴리오
- **배포**: Vercel, `website/` 서브디렉토리 기준
