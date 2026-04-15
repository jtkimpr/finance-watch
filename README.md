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
├── trigger/                    # 맥미니 cron 트리거 스크립트
│   ├── trigger.sh              # GitHub Actions 트리거 + git pull + 파일 복사
│   ├── trigger.log             # 실행 로그 (git 추적 제외)
│   └── PROJECT_NOTES.md        # 트리거 상세 설명 및 트러블슈팅
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

- `trigger.sh` 위치: `/Users/jtmacmini/claude_github/finance-watch/trigger/trigger.sh`
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

## 웹사이트 기술 스택

| 항목 | 내용 |
|------|------|
| 프레임워크 | Next.js 15 (App Router) |
| 언어 | TypeScript |
| 스타일 | Tailwind CSS + inline styles |
| 차트 | lightweight-charts (MSTR 페이지) |
| 배포 | Vercel (diracbroglie.com) |

---

## 웹사이트 파일 구조

```
website/src/
├── app/
│   ├── page.tsx                        # 루트 → /about 리다이렉트
│   ├── globals.css                     # 다크 팔레트 전역 스타일
│   ├── (dashboard)/
│   │   ├── layout.tsx                  # 대시보드 레이아웃 (Navbar + 사이드바)
│   │   ├── about/page.tsx              # Company 페이지 (공개)
│   │   ├── investments/page.tsx        # Investments 페이지 (패스워드 보호)
│   │   ├── mstr/page.tsx               # MSTR 페이지 (공개, 차트)
│   │   └── family/page.tsx             # Family 페이지 (비밀번호 보호)
│   └── api/
│       ├── family/route.ts             # 멤버별 보유 종목 반환
│       └── family-total/route.ts       # 전체 합계 + 전일 비교 + 카테고리 배분 반환
└── components/layout/
    ├── Navbar.tsx                      # 상단 오렌지 네비게이션 바
    └── Sidebar.tsx                     # 좌측 사이드바
```

---

## 디자인 스펙

| 항목 | 값 |
|------|----|
| 배경 | `#0c0c0e` |
| 텍스트 (주) | `#f0f0ee` |
| 텍스트 (부) | `#a0a0a8` |
| 텍스트 (dim) | `#60606a` |
| 구분선 | `#28282e` |
| 액센트 (오렌지) | `#FA660F` |
| 폰트 | Inter (900/700/600/500/400) |
| Body 텍스트 | 18px / line-height 1.7 |
| 섹션 헤딩 | 20px / weight 600 |
| 히어로 헤딩 | 52px / weight 900 |

---

## 페이지별 주요 기능

### Company (`/about`)
- 2컬럼 히어로: 헤드라인 + quant 차트 이미지
- Investment Philosophy 3단 그리드 (01/02/03)
- Company Info 테이블 (하단)

### Investments (`/investments`)
- 패스워드 게이트: 미인증 시 포트폴리오 대신 인라인 폼 표시
- 인증 상태는 `sessionStorage`에 저장 (탭 닫으면 자동 로그아웃)
- 핵심 지표: 총 평가금액 / 현 수익률
- 자산 비중 바 (Cash / US Stock / US Bonds / Gold / Kor Stock)
- 카테고리 필터 버튼 (Total / Cash / Gold / Kor Stock / US Stock / US Bonds)
- 보유종목 테이블

### MSTR (`/mstr`)
- lightweight-charts 기반 캔들스틱 + 지표 차트
- GitHub raw URL에서 실시간 CSV fetch
- 기간 버튼 (Max / 1y / 6m / 3m / 1m / 7d) — React portal로 Navbar 중앙에 렌더링
- 마우스 드래그 스크롤 비활성화 (`handleScroll: false, handleScale: false`)
- 최신 데이터가 항상 오른쪽 끝 기준으로 표시

### Navbar
- 오렌지 sticky 바 (height: 48px, `position: sticky, top: 0, zIndex: 50`)
- 중앙 슬롯 (`#navbar-center`): MSTR 페이지에서 portal로 기간 버튼 주입
- 우측 사람 아이콘 → Admin 패널 모달

---

## 인증 구조

### Investments 잠금 해제
- 패스워드: `localStorage.getItem("dnb_password") || "980612"` (기본값)
- 인증 성공 시 `sessionStorage.setItem("dnb_auth", "1")` 저장
- 탭/브라우저 종료 시 자동 로그아웃

### Admin 패널 (사람 아이콘)
- Admin 패스워드: `localStorage.getItem("dnb_admin_password") || "jintae.kim.dnb@gmail.com"` (기본값)
- 인증 후 Investments 패스워드 변경 가능
- "Lock Investments" 버튼으로 현재 세션 강제 로그아웃

### 스토리지 키 정리

| localStorage 키 | 용도 | 기본값 |
|-----------------|------|--------|
| `dnb_password` | Investments 잠금 해제 패스워드 | `980612` |
| `dnb_admin_password` | Admin 패널 진입 패스워드 | `jintae.kim.dnb@gmail.com` |

| sessionStorage 키 | 용도 |
|-------------------|------|
| `dnb_auth` | Investments 인증 상태 (탭 닫으면 삭제) |

> 패스워드 초기화: 브라우저 개발자 도구 → Application → Local Storage에서 해당 키 삭제

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

## 트러블슈팅

### GitHub Actions 워크플로우 실패

**증상**: `Update strategy prices` 스텝 실패 (exit code 1)

**원인**: Finnhub 무료 플랜에서 STRK/STRC/STRD/STRF (Strategy preferred 종목) 403 에러 + 네트워크 타임아웃 발생

**해결 (2026-04-09 적용)**:
- `update_prices.py`에 yfinance 폴백 추가: Finnhub 실패 시 자동으로 yfinance에서 가격 조회
- 네트워크 오류 시 5초 대기 후 1회 재시도
- 일부 티커 실패해도 `exit(1)` 하지 않음 → 워크플로우 계속 진행

**GitHub Actions 로그 확인 방법** (gh CLI 없을 때):
```bash
PAT=$(cat ~/.finance_pat)
# 최근 실행 목록
curl -s -H "Authorization: token $PAT" \
  "https://api.github.com/repos/jtkimpr/finance-watch/actions/runs?per_page=5" \
  | python3 -c "import json,sys; [print(r['id'], r['conclusion'], r['created_at']) for r in json.load(sys.stdin)['workflow_runs']]"

# 특정 run의 스텝별 결과 (RUN_ID 교체)
curl -s -H "Authorization: token $PAT" \
  "https://api.github.com/repos/jtkimpr/finance-watch/actions/runs/RUN_ID/jobs" \
  | python3 -c "import json,sys; [print(s['name'], s['conclusion']) for j in json.load(sys.stdin)['jobs'] for s in j['steps']]"

# 로그 다운로드 (JOB_ID 교체)
curl -sL -H "Authorization: token $PAT" \
  "https://api.github.com/repos/jtkimpr/finance-watch/actions/jobs/JOB_ID/logs" -o /tmp/gh_logs.txt
```

---

## 로컬 개발 환경

- 서버 시작 스크립트: `/Users/jtmacmini/start-dnb.sh`
- launch.json: `/Users/jtmacmini/.claude/launch.json` (서버명: `dnb-website`, 포트: 3000)
- 작업 디렉토리: `/Users/jtmacmini/claude_github/finance-watch/website`

---

## 주요 이력

| 날짜 | 내용 |
|------|------|
| 2026-04-15 | `finance-watch-trigger` 독립 레포를 `trigger/` 서브폴더로 통합. crontab 경로 업데이트 |
| 2026-04-09 | `update_prices.py` 에러 처리 강화: Finnhub 실패 시 yfinance 폴백, 네트워크 오류 1회 재시도, 일부 실패해도 워크플로우 계속 진행 (exit(1) 제거) |
| 2026-03-23 | `dnb-website` 레포를 `finance-watch/website/`로 통합 |
| 2026-03-23 | MSTR 페이지 CSV 로드 방식을 GitHub raw URL 실시간 fetch로 전환 |
| 2026-03-23 | GitHub Actions에 `update_prices.py`, `update_holdings.py` 스텝 추가 |
| 2026-03-23 | Family 페이지 추가 (Susie / Jintae / Hyunhee 보유 종목, 비밀번호 보호) |
| 2026-03-23 | Family 페이지 Total 탭 추가 (전체/개인별 합계, 카테고리 비중 비교) |
| 2026-03-23 | `generate_portfolio_json.py`에 `_prev_totals` 저장 로직 추가 (전일 비교용) |
| 2026-03-23 | `vercel.json` ignoreCommand 버그 수정 (`!` 누락으로 배포 누락 되던 문제) |

