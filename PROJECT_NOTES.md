# finance-watch 프로젝트 노트

## 프로젝트 개요

국내외 주식/ETF/암호화폐/환율 가격 및 거래량을 자동 수집하여 `data/watchlist.xlsx`에 저장하고, 이를 기반으로 웹사이트를 구축하는 프로젝트.

---

## 디렉토리 구조

```
finance-watch/
├── data/
│   └── watchlist.xlsx          # 자동 업데이트되는 데이터 파일
├── scripts/
│   ├── update_watchlist.py     # GitHub Actions에서 실행되는 데이터 수집 스크립트
│   └── pull_sync.sh            # (미사용) 구버전 launchd용 동기화 스크립트
├── .github/
│   └── workflows/
│       └── daily_update.yml    # GitHub Actions 워크플로우
├── PROJECT_NOTES.md            # 이 파일
└── requirements.txt
```

---

## 데이터 흐름

```
맥미니 cron (정시 실행)
        ↓
  trigger.sh → GitHub API로 workflow_dispatch 트리거
        ↓
  GitHub Actions 실행 (완료 폴링, 최대 10분 대기)
  데이터 수집 (pykrx / yfinance / finnhub / CoinGecko)
  data/watchlist.xlsx 업데이트 → GitHub 커밋 & 푸시
        ↓
  trigger.sh → git pull → 로컬 watchlist.xlsx 최신화
        ↓
  watchlist.xlsx → Documents 폴더로 복사 (Family Balance Sheet)
```

### 맥미니 cron 실행 시각 (KST)

| cron 표현식 | KST |
|---|---|
| `10 0 * * *` | 00:10 |
| `10 9 * * *` | 09:10 |
| `10 12 * * *` | 12:10 |
| `10 16 * * *` | 16:10 |

- **트리거 스크립트**: `~/claude_works/finance-watch-trigger/trigger.sh`
- **로그**: `~/claude_works/finance-watch-trigger/trigger.log`
- **수동 실행**: `bash ~/claude_works/finance-watch-trigger/trigger.sh`

### GitHub Actions 백업 스케쥴

맥미니가 꺼져 있거나 cron이 실패한 경우를 대비해 09:40 KST에 Actions 자체 스케쥴(`schedule`) 실행됨.

### GitHub PAT 관리

- **저장 위치**: `~/.finance_pat` (파일 권한 `600`)
- 키체인 방식은 cron 환경에서 접근 불가 문제로 파일 방식으로 전환 (2026-03-23)
- PAT 만료 시 `~/.finance_pat` 파일 내용을 새 토큰으로 교체

---

## watchlist.xlsx 구조

### 시트 목록

| 시트 | 설명 |
|---|---|
| Info | 종목 정보 + 포트폴리오 보유량 (Dirac & Broglie / Susie / Jintae / Hyunhee / Family) |
| Price | 날짜별 종가 데이터 (row 1: 헤더, row 2: 최신 데이터) |
| Volume | 날짜별 거래량 데이터 (USD_KRW 컬럼 없음) |

### Price / Volume 컬럼 순서

```
Date, 423160, 459580, 475630, SGOV,
Strategy Prf, Strategy Prf A, Strategy Prf D, Strategy Prf F,
USDT_KRW Upbit, USD_KRW (Price only),
411060, 0085P0, 476760,
VGIT, VGLT, VTIP,
182480, 232080, 360200, 361580, 379800, 379810, 438080,
UB Care, 0163Y0, QQQM, SCHD, SPYM, Strategy, VIG, Bitcoin, Ethereum
```

> **중요**: `update_watchlist.py`의 `PRICE_COLUMNS` / `VOLUME_COLUMNS` 순서가 위 엑셀 컬럼 순서와 반드시 일치해야 함. 순서가 어긋나면 데이터가 엉뚱한 컬럼에 기록됨.

### 엑셀 업데이트 방식

- row 2의 날짜 = 오늘이면 **덮어쓰기**
- row 2의 날짜 ≠ 오늘이면 **row 2에 새 행 삽입** (오래된 데이터는 아래로 밀림)
- 날짜 형식: `MM/DD/YYYY` 문자열

### Info 시트 구조

- `Price` 컬럼: `=INDEX(Price!X:X, MATCH(...))` 수식으로 Price 시트에서 최신 가격 자동 참조
- `Family` 컬럼: `=SUM(F:I)` 수식으로 4명의 보유량 합산

---

## 데이터 소스

| 소스 | 대상 종목 |
|---|---|
| pykrx | 한국 ETF/주식 (423160, 459580, 475630, 411060, 0085P0, 0163Y0, 476760, 182480, 232080, 360200, 361580, 379800, 379810, 438080, UB Care) |
| yfinance | 미국 ETF/주식/환율 (Bitcoin, Ethereum, QQQM, SCHD, SGOV, SPYM, Strategy, USD_KRW, VGIT, VGLT, VIG, VTIP) |
| finnhub | Strategy 우선주 (Strategy Prf / A / D / F) |
| CoinGecko | USDT_KRW Upbit (가격 + Upbit 거래량) |

### 필요한 GitHub Secret

- `FINNHUB_API_KEY`: Finnhub API 키 (레포 Settings → Secrets → Actions)

---

## 주요 이력

### 2026-03-23

- 로컬 자동화 방식 변경: launchd → cron + trigger.sh (workflow_dispatch 방식)
- GitHub PAT 저장 방식 변경: 키체인 → `~/.finance_pat` 파일 (cron 환경에서 키체인 접근 불가 이슈 해결)
- 복사 대상 추가: git pull 후 `watchlist.xlsx`를 Documents의 `Family Balance Sheet` 파일로 자동 복사
- 신규 종목 추가: KoAct 코스닥액티브 (0163Y0, KRX, Kor Stock)
  - `PYKRX_TICKERS`에 `"0163Y0": "0163Y0"` 추가
  - `PRICE_COLUMNS` / `VOLUME_COLUMNS`에 `"UB Care"` 뒤에 `"0163Y0"` 추가
  - `watchlist.xlsx` Info / Price / Volume 시트에 컬럼 및 데이터 반영 (03/11 ~ 03/23)

### 2026-03-20

- 엑셀 구조 변경 (Info 시트 재편, 컬럼 순서 재정렬, 423160 종목 추가, Family 컬럼 추가)
- `update_watchlist.py`의 `PRICE_COLUMNS` / `VOLUME_COLUMNS`를 실제 엑셀 순서에 맞게 수정
- `PYKRX_TICKERS`에 423160 추가

---

## 다음 작업: 웹사이트 구축

`data/watchlist.xlsx`를 데이터 소스로 활용하는 웹사이트 개발 예정.

- 기술 스택 및 상세 요구사항은 작업 시작 시 별도 논의
