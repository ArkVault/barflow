#!/usr/bin/env bash
# Pre-commit secret scanner.
# Scans staged content for common secret patterns and blocks the commit if found.
# Install as a git pre-commit hook (see .githooks/pre-commit).

set -uo pipefail

# Only scan files staged for commit (added/modified), excluding deletions.
files=$(git diff --cached --name-only --diff-filter=ACM)
[ -z "$files" ] && exit 0

# Patterns: name|regex
patterns=(
  "Stripe live secret|sk_live_[A-Za-z0-9]{20,}"
  "Stripe restricted live|rk_live_[A-Za-z0-9]{20,}"
  "Stripe webhook secret|whsec_[A-Za-z0-9]{30,}"
  "Google API key|AIzaSy[A-Za-z0-9_-]{33}"
  "JWT-like token|eyJ[A-Za-z0-9_-]{40,}\\.[A-Za-z0-9_-]{40,}\\.[A-Za-z0-9_-]{20,}"
  "AWS access key|AKIA[0-9A-Z]{16}"
  "GitHub PAT|ghp_[A-Za-z0-9]{30,}"
  "Slack token|xox[baprs]-[A-Za-z0-9-]{20,}"
  "Generic private key|BEGIN (RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY"
)

found=0
for f in $files; do
  # Skip non-text or vendored
  case "$f" in
    *.lock|*.lockb|node_modules/*|.next/*|*.png|*.jpg|*.jpeg|*.gif|*.webp|*.ico|*.pdf|*.woff*|*.ttf) continue ;;
    .env.example) continue ;;
  esac
  # Allow .gitignore self-references and pattern files
  case "$f" in
    .gitignore|.claude/hooks/scan-secrets.sh) continue ;;
  esac

  diff_output=$(git diff --cached -U0 -- "$f")
  for entry in "${patterns[@]}"; do
    name="${entry%%|*}"
    regex="${entry#*|}"
    matches=$(printf '%s\n' "$diff_output" | grep -E "^\+" | grep -Eo "$regex" | head -3 || true)
    if [ -n "$matches" ]; then
      echo "❌ Possible secret detected ($name) in: $f"
      echo "   matched: $(echo "$matches" | head -1 | cut -c1-40)…"
      found=1
    fi
  done
done

if [ "$found" -ne 0 ]; then
  echo ""
  echo "Commit blocked. Remove the secrets, rotate them if exposed, and re-stage."
  echo "If this is a false positive, bypass with: git commit --no-verify"
  exit 1
fi
exit 0
