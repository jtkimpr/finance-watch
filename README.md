# finance-watch

주식 watchlist 자동 업데이트 및 투자 현황 웹사이트 관리 프로젝트.

---

## 레포 구조

```
finance-watch/
├── data/
│   ├── watchlist.xlsx          # 주식 watchlist (메인 데이터)
│   ├── portfolio.json          # 포트폴리오 (웹 대시보드용)
│   └── strategy/               # BTC/MSTR/STR* 전략 데이터 CSV
│       ├── btc.csv, mstr.csv, strc.csv, strd.csv, strf.csv, strk.csv
│       ├── btc_holdings.csv    # BTC 보유량
│       ├── mstr_shares.csv     # MSTR 주식수
│       └── mstr_debt.csv       # MSTR 부채
├── scripts/
│   ├── update_watchlist.py     # watchlist.xlsx 가격 업데이트 (Finnhub API)
│   ├── generate_portfolio_json.py  # portfolio.json 생성
│   ├── update_prices.py        # data/strategy/ CSV 가격 업데이트
│   └── update_holdings.py      # BTC 보유량/주식수/부채 업데이트
├── website/                    # Next.js 웹 대시보드
│   ├── src/app/(dashboard)/
│   │   ├── mstr/page.tsx       # MSTR 페이지 (GitHub raw URL로 CSV 실시간 fetch)
│   │   ├── investments/        # 투자 현황 페이지
│   │   └── family/page.tsx     # 가족 포트폴리오 페이지 (비밀번호 보호)
│   ├── src/app/api/
│   │   ├── family/route.ts     # 멤버별 보유 종목 반환
│   │   └── family-total/route.ts  # 전체 합계 + 전일 비교 + 카테고리 배분 반환
│   └── vercel.json             # website/ 변경 시에만 Vercel 빌드 트리거
└── .github/workflows/
    └── daily_update.yml        # 통합 자동화 워크플로우
```

---

## 자동화 워크플로우

매일 KST 09:10 기준으로 아래 순서로 실행됨.

| 단계 | 수행 주체 | 내용 |
|------|-----------|------|
| 1 | 맥미니 cron (09:10 KST) | `trigger.sh` 실행 |
| 2 | trigger.sh | GitHub Actions `workflow_dispatch` 트리거 |
| 3 | GitHub Actions | `update_watchlist.py` → watchlist.xlsx 가격 업데이트 |
| 4 | GitHub Actions | `generate_portfolio_json.py` → portfolio.json 생성 |
| 5 | GitHub Actions | `update_prices.py` → data/strategy/ CSV 업데이트 |
| 6 | GitHub Actions | `update_holdings.py` → BTC/주식수/부채 CSV 업데이트 |
| 7 | GitHub Actions | git commit & push (변경 있을 때만) |
| 8 | 맥미니 trigger.sh | git pull → watchlist.xlsx를 Documents 폴더로 복사 |
| 백업 | GitHub Actions (09:40 KST) | schedule cron (맥미니 장애 시 백업) |

- `trigger.sh` 위치: `/Users/jtmacmini/claude_works/finance-watch-trigger/trigger.sh`
- PAT 위치: `/Users/jtmacmini/.finance_pat`
- PAT 주의: `delete_repo` 권한 없음 (레포 삭제는 GitHub 웹에서 직접)

---

## 웹사이트 배포 (Vercel)

- 플랫폼: Vercel Hobby
- 연결 레포: `jtkimpr/finance-watch`
- Root Directory: `website`
- 빌드 조건: `website/` 경로 변경 시에만 트리거 (`vercel.json` ignoreCommand)
- 데이터 커밋(`data/`) 시에는 Vercel 재빌드 없음

### MSTR 페이지 데이터 로드 방식
페이지를 열 때 실시간으로 GitHub raw URL에서 CSV fetch (Vercel 재배포 불필요):
```
https://raw.githubusercontent.com/jtkimpr/finance-watch/main/data/strategy/{name}.csv
```
`cache: 'no-store'` 설정으로 항상 최신 데이터 사용.

---

## Family 페이지

비밀번호로 보호된 가족 포트폴리오 페이지 (`/family`).

### 탭 구성

| 탭 | 내용 |
|----|------|
| Total | 전체 합계, 개인별 현황, 카테고리별 비중 비교 (Total / D&B / Susie / Jintae / Hyunhee) |
| Susie | Susie 보유 종목 상세 |
| Jintae | Jintae 보유 종목 상세 |
| Hyunhee | Hyunhee 보유 종목 상세 |

### 데이터 흐름

```
watchlist.xlsx (Admin 시트)
  → generate_portfolio_json.py
  → data/portfolio.json  (키: Susie, Dirac & Broglie, Jintae, Hyunhee, _prev_totals)
  → GitHub raw URL
  → /api/family (멤버별 종목)
  → /api/family-total (합계 + 전일 비교 + 카테고리 배분)
  → family/page.tsx
```

### 전일 비교 동작 방식

`generate_portfolio_json.py` 실행 시:
1. 기존 `portfolio.json`의 각 멤버 총액을 읽어 `_prev_totals`로 저장
2. 새 포트폴리오 데이터를 덮어씀

→ 다음 날 `generate_portfolio_json.py`가 실행되면, 전날 총액이 `_prev_totals`로 보존되어 전일 대비 % 변동이 Total 탭에 표시됨.

### 비밀번호

- 기본값: `980612`
- `localStorage("dnb_password")` 키로 변경 가능

---

## 로컬 개발 환경

- 서버 시작 스크립트: `/Users/jtmacmini/start-dnb.sh`
- launch.json: `/Users/jtmacmini/.claude/launch.json` (서버명: `dnb-website`, 포트: 3000)
- 작업 디렉토리: `/Users/jtmacmini/github-clone/finance-watch/website`

---

## 주요 이력

| 날짜 | 내용 |
|------|------|
| 2026-03-23 | `dnb-website` 레포를 `finance-watch/website/`로 통합 |
| 2026-03-23 | MSTR 페이지 CSV 로드 방식을 GitHub raw URL 실시간 fetch로 전환 |
| 2026-03-23 | GitHub Actions에 `update_prices.py`, `update_holdings.py` 스텝 추가 |
| 2026-03-23 | Family 페이지 추가 (Susie / Jintae / Hyunhee 보유 종목, 비밀번호 보호) |
| 2026-03-23 | Family 페이지 Total 탭 추가 (전체/개인별 합계, 카테고리 비중 비교) |
| 2026-03-23 | `generate_portfolio_json.py`에 `_prev_totals` 저장 로직 추가 (전일 비교용) |
| 2026-03-23 | `vercel.json` ignoreCommand 버그 수정 (`!` 누락으로 배포 누락 되던 문제) |
