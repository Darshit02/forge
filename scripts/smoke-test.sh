#!/usr/bin/env bash
set -euo pipefail

echo "=========================================="
echo " Running Forge End-to-End Smoke Test"
echo "=========================================="

bun run ./scripts/smoke-test.ts
