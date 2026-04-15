# finance-watch trigger 노트

## 개요

맥미니 cron에서 정시에 실행되어 GitHub Actions `workflow_dispatch`를 트리거하고,
워크플로우 완료 후 git pull 및 파일 복사까지 수행하는 자동화 스크립트.

`finance-watch` 레포 안의 `trigger/` 서브폴더로 통합 관리됨.

---

## 파일 구조

```
finance-watch/
└── trigger/
    ├── trigger.sh          # 메인 자동화 스크립트
    ├── trigger.log         # 실행 로그 (git 추적 제외)
    └── PROJECT_NOTES.md    # 이 파일
```

---

## 자동화 흐름

```
cron 정시 실행
    ↓
① PAT 로드 (~/.finance_pat)
    ↓
② GitHub API로 workflow_dispatch 트리거
    ↓
③ sleep 15초 후 run_id 확인, 완료 폴링 (10초 간격, 최대 10분)
    ↓
④ 로컬 변경사항 감지 → 있으면 git stash
    ↓
⑤ git pull (finance-watch 레포 로컬 동기화)
    ↓
⑥ stash 복원 — xlsx 충돌 시 GitHub Actions 버전 자동 채택
    ↓
⑦ watchlist.xlsx → Documents/Family Balance Sheet 복사 (실패 시 3회 재시도)
```

---

## cron 설정

```
# crontab -l 로 확인
10 0  * * *  /Users/jtmacmini/claude_github/finance-watch/trigger/trigger.sh  # 00:10 KST
10 9  * * *  /Users/jtmacmini/claude_github/finance-watch/trigger/trigger.sh  # 09:10 KST
10 12 * * *  /Users/jtmacmini/claude_github/finance-watch/trigger/trigger.sh  # 12:10 KST
10 16 * * *  /Users/jtmacmini/claude_github/finance-watch/trigger/trigger.sh  # 16:10 KST
```

---

## 주요 경로

| 항목 | 경로 |
|------|------|
| 트리거 스크립트 | `~/claude_github/finance-watch/trigger/trigger.sh` |
| 실행 로그 | `~/claude_github/finance-watch/trigger/trigger.log` |
| GitHub PAT | `~/.finance_pat` (권한 `600`) |
| 로컬 레포 | `~/claude_github/finance-watch` |
| 복사 대상 파일 | `~/Documents/3. Jintae Kim/Finance JT/Plan/Family Balance Sheet_*.xlsx` |

---

## GitHub PAT 관리

- **저장 위치**: `~/.finance_pat` (파일 권한 `600`, 소유자만 읽기/쓰기)
- cron 환경에서 macOS 키체인 접근이 불가하여 파일 방식으로 저장 (2026-03-23 전환)
- PAT 만료 시 교체 방법:
  ```bash
  echo "새_PAT_값" > ~/.finance_pat
  chmod 600 ~/.finance_pat
  ```

---

## 수동 실행

```bash
bash ~/claude_github/finance-watch/trigger/trigger.sh
```

---

## 로그 예시 (정상 — 로컬 변경사항 없는 경우)

```
[2026-03-24 16:38:08] SUCCESS: 워크플로우 트리거 완료
[2026-03-24 16:38:23] INFO: run_id=23478348769 실행 중, 완료 대기...
[2026-03-24 16:38:55] SUCCESS: 워크플로우 완료 (conclusion=success)
[2026-03-24 16:38:55] INFO: 로컬 변경사항 stash 처리
[2026-03-24 16:38:56] GIT PULL: ...Fast-forward...
[2026-03-24 16:38:56] INFO: stash 복원 완료
[2026-03-24 16:38:56] SUCCESS: 파일 복사 완료 → .../Family Balance Sheet_260323.xlsx
```

---

## 트러블슈팅

### run_id 확인 실패

- 증상: `ERROR: run_id 확인 실패` 로그 후 스크립트 종료
- 원인: 트리거 직후 GitHub API 응답이 느려 run_id를 못 잡음
- 해결: 트리거 후 대기 시간을 5초 → 15초로 증가 (2026-03-24)

### git pull 실패 (로컬 변경사항 충돌)

- 증상: `error: Your local changes to the following files would be overwritten by merge`
- 원인: 로컬에서 watchlist.xlsx를 수동 수정 후 커밋하지 않은 상태에서 git pull
- 해결: git pull 전 자동 stash, pull 후 복원 / xlsx 충돌 시 GitHub Actions 버전 자동 채택 (2026-03-24)

### 파일 복사 실패

- 증상: `ERROR: 파일 복사 실패` 로그
- 원인: cp 에러가 `2>/dev/null`로 숨겨져 있어 정확한 원인 파악 불가했음
- 해결: 에러 메시지 로그에 기록 + 3회 재시도 로직 추가 (2026-03-24)

---

## 주요 이력

### 2026-04-15

- `finance-watch-trigger` 독립 레포에서 `finance-watch/trigger/` 서브폴더로 통합
- crontab 경로 업데이트: `claude_github/finance-watch-trigger/` → `claude_github/finance-watch/trigger/`

### 2026-03-26

- git pull 실패 (osxkeychain -61) 수정: `git -c credential.helper="" pull` + `GIT_TERMINAL_PROMPT=0` 적용
  - 원인: cron 환경에서 macOS 키체인 데몬 접근 불가 → git pull이 "failed to store: -61"로 실패
  - 증상: GitHub Actions는 정상 커밋했으나 로컬 git pull이 안 돼서 Documents 파일이 업데이트 안 됨
  - 해결: credential helper 비활성화 + pull 실패 시 exit 1로 명시적 에러 처리 추가

### 2026-03-24

- run_id 확인 대기 시간 5초 → 15초로 수정
- git pull 전 자동 stash / 복원 로직 추가 (로컬 변경사항 충돌 방지)
- stash 복원 시 xlsx 충돌 자동 해결 (GitHub Actions 버전 우선)
- 파일 복사: `2>/dev/null` 제거 → 에러 로그 기록 + 3회 재시도 추가

### 2026-03-23

- 최초 작성
- PAT 로드 방식: 키체인 → `~/.finance_pat` 파일로 전환 (cron 키체인 접근 불가 이슈)
