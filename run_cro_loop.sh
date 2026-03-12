#!/bin/bash
# Autonomous CRO experiment loop — runs continuously until stopped with Ctrl+C.
# Each iteration: pick next change → apply → evaluate → keep/discard → push.
#
# Usage:
#   source .venv-cro/bin/activate
#   export ANTHROPIC_API_KEY=sk-ant-...
#   chmod +x run_cro_loop.sh
#   ./run_cro_loop.sh

set -euo pipefail
cd "$(dirname "$0")"

BRANCH="claude/review-fork-redirect-fDWb7"
INTERVAL=300  # seconds between iterations

iteration=0
while true; do
  iteration=$((iteration + 1))
  echo ""
  echo "═══════════════════════════════════════════════════════════"
  echo "  CRO Experiment Loop — Iteration $iteration ($(date '+%H:%M:%S'))"
  echo "═══════════════════════════════════════════════════════════"

  # Run one iteration via Claude Code in non-interactive mode
  claude --print -p "$(cat <<'PROMPT'
You are an autonomous CRO agent. Execute ONE iteration of the experiment loop:

1. Read results.tsv to see the current best composite_cro score and what's been tried.
2. Read program_web.md for the prioritised Wave 1-3 change list.
3. Pick the next highest-priority UNTRIED change.
4. Read the relevant site/ file, make the change (one focused edit).
5. Run: git add site/ && git commit -m "CRO: [brief description]"
6. Run: python3 run_cro.py > run.log 2>&1
7. Run: grep "^composite_cro:" run.log
8. Compare to previous best score in results.tsv:
   - If IMPROVED: log as "keep" in results.tsv
   - If SAME or WORSE: log as "discard" in results.tsv, then run: git reset --hard HEAD~1
9. Run: git push -u origin claude/review-fork-redirect-fDWb7

IMPORTANT:
- Only make ONE change per iteration
- Only modify files in site/
- Never modify prepare_web.py, evaluate_web.py, or run_cro.py
- All copy must be British English, direct, punchy
- If run_cro.py crashes, read tail of run.log and try to fix
PROMPT
)" --allowedTools "Edit,Read,Bash,Grep,Glob,Write"

  echo ""
  echo "  Iteration $iteration complete. Sleeping ${INTERVAL}s..."
  echo "  (Ctrl+C to stop)"
  sleep $INTERVAL
done
