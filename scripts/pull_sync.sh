#!/bin/bash
# finance-watch 로컬 동기화 스크립트
# GitHub Actions 실행 후 자동으로 git pull을 수행합니다.

REPO_DIR="/Users/jtmini/claude_github/finance-watch"
LOG_FILE="$HOME/Library/Logs/finance-watch-pull.log"

echo "=== $(TZ='Asia/Seoul' date '+%Y-%m-%d %H:%M:%S KST') ===" >> "$LOG_FILE"
cd "$REPO_DIR" && git pull >> "$LOG_FILE" 2>&1
echo "" >> "$LOG_FILE"
