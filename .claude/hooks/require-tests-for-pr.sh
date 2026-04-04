#!/usr/bin/env bash
set -euo pipefail

if pnpm test --silent; then
  exit 0
else
  echo "Tests are failing. Fix all test failures before creating a PR." >&2
  exit 2
fi
