#!/bin/bash

# finance-watch GitHub Actions 트리거 스크립트
# 맥미니 cron에서 정시에 호출 → GitHub Actions workflow_dispatch → 완료 후 git pull

LOG="/Users/jtmini/claude_github/finance-watch/trigger/trigger.log"
REPO="jtkimpr/finance-watch"
LOCAL_DIR="/Users/jtmini/claude_github/finance-watch"
DEST_FILE="/Users/jtmini/Documents/3. Jintae Kim/Finance JT/Plan/Family Balance Sheet_260323.xlsx"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG"
}

# curl 공통 옵션: 연결 10초, 응답 30초 타임아웃
CURL_OPTS="--connect-timeout 10 --max-time 30"

# 1. PAT 로드
PAT=$(cat /Users/jtmini/.finance_pat 2>/dev/null | tr -d '[:space:]')
if [ -z "$PAT" ]; then
  log "ERROR: PAT를 파일에서 찾을 수 없음 (~/.finance_pat)"
  exit 1
fi

# 2. 워크플로우 트리거 (실패 시 3회 재시도)
TRIGGER_SUCCESS=false
for i in 1 2 3; do
  HTTP_STATUS=$(curl -s $CURL_OPTS -o /dev/null -w "%{http_code}" -X POST \
    -H "Accept: application/vnd.github+json" \
    -H "Authorization: Bearer $PAT" \
    "https://api.github.com/repos/${REPO}/actions/workflows/daily_update.yml/dispatches" \
    -d '{"ref":"main"}')

  if [ "$HTTP_STATUS" -eq 204 ]; then
    TRIGGER_SUCCESS=true
    break
  fi
  log "WARN: 트리거 실패 (HTTP $HTTP_STATUS, 시도 $i/3) — 10초 후 재시도"
  sleep 10
done

if [ "$TRIGGER_SUCCESS" = false ]; then
  log "ERROR: 트리거 최종 실패 (HTTP $HTTP_STATUS, 3회 시도 모두 실패)"
  exit 1
fi
log "SUCCESS: 워크플로우 트리거 완료"
TRIGGER_TIME=$(date +%s)

# 3. run_id 확인 (트리거 직후 잠시 대기 후, 최대 3회 재시도)
sleep 15
RUN_ID=""
for i in 1 2 3; do
  RUN_ID=$(curl -s $CURL_OPTS \
    -H "Accept: application/vnd.github+json" \
    -H "Authorization: Bearer $PAT" \
    "https://api.github.com/repos/${REPO}/actions/runs?per_page=5&event=workflow_dispatch" \
    | python3 -c "
import json, sys, time
try:
    runs = json.load(sys.stdin).get('workflow_runs', [])
    # 트리거 시각 기준 ±120초 이내 run만 채택
    trigger_time = int('${TRIGGER_TIME}')
    for r in runs:
        from datetime import datetime, timezone
        created = datetime.strptime(r['created_at'], '%Y-%m-%dT%H:%M:%SZ').replace(tzinfo=timezone.utc)
        if abs(created.timestamp() - trigger_time) < 120:
            print(r['id'])
            break
except Exception:
    pass
" 2>/dev/null)

  if [ -n "$RUN_ID" ]; then
    break
  fi
  log "WARN: run_id 확인 실패 (시도 $i/3) — 10초 후 재시도"
  sleep 10
done

# run_id를 끝내 못 찾으면 blind pull 모드로 전환
if [ -z "$RUN_ID" ]; then
  log "WARN: run_id 확인 실패 — 트리거 성공 기준으로 3분 대기 후 git pull 진행 (blind pull)"
  sleep 180
else
  log "INFO: run_id=$RUN_ID 실행 중, 완료 대기..."

  # 4. 완료될 때까지 폴링 (최대 10분)
  MAX_WAIT=60
  COUNT=0
  while [ $COUNT -lt $MAX_WAIT ]; do
    sleep 10
    COUNT=$((COUNT + 1))

    RESULT=$(curl -s $CURL_OPTS \
      -H "Accept: application/vnd.github+json" \
      -H "Authorization: Bearer $PAT" \
      "https://api.github.com/repos/${REPO}/actions/runs/${RUN_ID}" \
      | python3 -c "
import json, sys
try:
    r = json.load(sys.stdin)
    print(r['status'] + '|' + str(r.get('conclusion') or ''))
except Exception:
    print('unknown|')
" 2>/dev/null)

    STATUS=$(echo "$RESULT" | cut -d'|' -f1)
    CONCLUSION=$(echo "$RESULT" | cut -d'|' -f2)

    if [ "$STATUS" = "completed" ]; then
      if [ "$CONCLUSION" = "success" ]; then
        log "SUCCESS: 워크플로우 완료 (conclusion=success)"
        break
      else
        log "ERROR: 워크플로우 완료됐지만 실패 (conclusion=$CONCLUSION)"
        exit 1
      fi
    fi
  done

  if [ $COUNT -ge $MAX_WAIT ]; then
    log "ERROR: 워크플로우 완료 대기 시간 초과 (10분)"
    exit 1
  fi
fi

# 5. git pull (로컬 변경사항이 있으면 stash 후 pull, 이후 복원)
cd "$LOCAL_DIR" || { log "ERROR: 로컬 디렉토리 접근 실패 ($LOCAL_DIR)"; exit 1; }

STASHED=false
if ! git diff --quiet || ! git diff --cached --quiet; then
  git stash push -m "trigger-auto-stash" >> /dev/null 2>&1
  STASHED=true
  log "INFO: 로컬 변경사항 stash 처리"
fi

PULL_RESULT=$(GIT_TERMINAL_PROMPT=0 git -c credential.helper="" pull 2>&1)
PULL_EXIT=$?
if [ $PULL_EXIT -ne 0 ]; then
  log "ERROR: git pull 실패 (exit=$PULL_EXIT) — $PULL_RESULT"
  exit 1
fi
log "GIT PULL: 성공 — $PULL_RESULT"

if [ "$STASHED" = true ]; then
  git stash pop 2>&1
  # xlsx 충돌 시 GitHub Actions 최신 버전 우선 채택
  if ! git diff --quiet -- data/watchlist.xlsx 2>/dev/null || git ls-files --unmerged | grep -q watchlist.xlsx; then
    git checkout --ours -- data/watchlist.xlsx
    log "INFO: stash 복원 — xlsx 충돌 발생, GitHub Actions 버전으로 자동 해결"
  else
    log "INFO: stash 복원 완료"
  fi
fi

# 6. 업데이트된 파일을 Documents 폴더로 복사 (실패 시 3회 재시도)
COPY_SUCCESS=false
for i in 1 2 3; do
  CP_ERR=$(cp "$LOCAL_DIR/data/watchlist.xlsx" "$DEST_FILE" 2>&1)
  if [ $? -eq 0 ]; then
    log "SUCCESS: 파일 복사 완료 → $DEST_FILE"
    COPY_SUCCESS=true
    break
  else
    log "WARN: 파일 복사 실패 (시도 $i/3) — $CP_ERR"
    sleep 3
  fi
done
if [ "$COPY_SUCCESS" = false ]; then
  log "ERROR: 파일 복사 최종 실패 (3회 시도 모두 실패)"
fi
