# Dirac & Broglie Website Project

## 프로젝트 개요
- **목적**: 가족법인(부동산·유가증권 투자) 내부 관리 포털 웹사이트 구축
- **성격**: 외부 홍보용이 아닌 가족 구성원 및 관련 전문가용 내부 포털
- **구축 방식**: Claude 활용 직접 제작

---

## 확정된 기획 내용

### 주요 방문자
- 가족 구성원 (내부)
- 거래 금융기관, 세무사 등 외부 전문가

### 디자인 방향
- 톤: 따뜻한 베이지·브라운 계열
- 느낌: 가족 법인 특유의 신뢰감 있고 따뜻한 스타일

### 주요 기능
- 로그인 필수 (비공개 사이트)
- 데이터 입력 방식: 엑셀/CSV 파일 업로드 → 자동 반영
- 외부 웹사이트 자동 조회: 하루 2회 스케줄로 데이터 업데이트

### 데이터 연동 방식 (확정)

#### 유가증권 데이터 — strategy-preferred 레포 연동
- **별도 레포**: `strategy-preferred` (바탕화면 동명 폴더, GitHub 연동)
- **자동 업데이트**: GitHub Actions로 하루 2회 (00:00, 12:00 KST) 자동 실행
- **데이터 소스**:
  - 가격(BTC, MSTR, STRF, STRK, STRC, STRD): Finnhub API + CoinGecko API
  - BTC 보유량: SEC EDGAR 8-K 공시 파싱
  - MSTR 발행주식수: Finnhub API
  - MSTR 금융부채: SEC EDGAR XBRL
- **저장 형식**: CSV 파일 (`data/` 폴더 — btc.csv, mstr.csv, strf.csv 등)
- **DNB 웹사이트 연동 방법**: GitHub Raw URL로 CSV 직접 읽기 → Vercel Cron 불필요
  - 예: `https://raw.githubusercontent.com/jtkimpr/strategy-preferred/main/data/mstr.csv`

#### 유가증권 보유 데이터 — 엑셀 연동 (미구현, 추후 작업)
- 현재 `securities/page.tsx`에 보유 종목 데이터가 하드코딩된 상태
- 엑셀 연동은 기획만 된 상태이며 아직 구현 안 됨
- 구현 방법 후보: 사이트 내 파일 업로드 방식 또는 Google Sheets API 연동 (추후 결정)
- 그 전까지는 데이터 변경 시 코드 직접 수정 후 GitHub push로 반영

---

## 페이지 구성

| 페이지 | 주요 내용 |
|---|---|
| 🔐 로그인 | 진입 화면, 비밀번호 보호 |
| 🏠 홈·대시보드 | 자산 요약, 수익률 한눈에 보기 |
| 🏢 법인 소개 | 설립 연혁, 구성원, 투자 철학 |
| 🏘 부동산 포트폴리오 | 보유 물건별 현황 |
| 📈 유가증권 포트폴리오 | 종목별 보유·수익률 현황 |
| 📊 투자 대시보드 | 자산 추이 차트, 수익률 시각화 |
| 📁 내부 문서함 | 공지사항, 문서 목록 |

---

## 기술 스택
- 프론트엔드: Next.js (TypeScript, Tailwind CSS)
- 로그인 방식: 단순 비밀번호 방식 (클라이언트 사이드)
- 호스팅: Vercel (Hobby 무료 플랜) — `diracbroglie.vercel.app`
- 코드 공유: GitHub (`jtkimpr/dnb-website`, main 브랜치)

---

## 작업 환경
- 회사: 맥북프로 16인치 + Claude Code
- 집: 맥에어 + Claude Code
- 코드 동기화: GitHub 저장소 (`jtkimpr/dnb-website`) — 로컬 클론 완료
- 대화 맥락 관리: Claude Code (로컬)

---

## 진행 현황

| 단계 | 상태 | 내용 |
|---|---|---|
| PHASE 1 기획 확정 | ✅ 완료 | 페이지 구성, 디자인 톤, 데이터 입력 방식 확정 |
| PHASE 2 디자인·구조 설계 | ⏳ 대기 | 와이어프레임, 컬러·폰트 결정 |
| PHASE 3 페이지별 제작 | ⏳ 대기 | 로그인 화면부터 순차 제작 |
| PHASE 4 데이터 연동 | ⏳ 대기 | CSV 업로드 → 차트 자동 반영 |
| PHASE 5 배포 및 접근 설정 | 🔄 진행중 | Vercel 배포 설정 완료, GitHub 연동 완료 |

---

## 미결 사항
- [ ] Vercel 배포 완료 확인 (`diracbroglie.vercel.app` 접속 테스트)
- [ ] 외부 사이트 자동 조회 기능 구현 (하루 2회 스케줄)
- [ ] 유가증권 보유 데이터 엑셀 연동 구현 (현재는 코드 하드코딩 상태)
- [ ] 각 페이지 실제 데이터 연결
- [ ] 집 맥에어에서도 GitHub 클론 및 동기화 확인

---

## 업데이트 이력
- 2026-03-14: 초안 작성 — 기획 확정 내용 정리
- 2026-03-16: 호스팅 확정 — Vercel Hobby(무료) 선택, GitHub(`jtkimpr/dnb-website`) 연동 완료, 프로젝트명 `diracbroglie`로 배포 진행 중
- 2026-03-16: 데이터 연동 방식 확정 — 유가증권 데이터는 strategy-preferred 레포(GitHub Actions 하루 2회) CSV를 GitHub Raw URL로 읽는 방식, 부동산/법인 데이터는 파일 업로드 또는 Google Sheets 연동 예정
