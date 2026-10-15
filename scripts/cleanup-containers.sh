#!/usr/bin/env bash
set -euo pipefail

echo "=========================================="
echo " Forge: Cleaning Up Sandbox Containers"
echo "=========================================="

# Check if docker is available
if command -v docker >/dev/null 2>&1; then
  CONTAINERS=$(docker ps -aq --filter "label=forge.project" 2>/dev/null || true)
  if [ -n "$CONTAINERS" ]; then
    echo "Stopping and removing containers labeled 'forge.project'..."
    docker rm -f $CONTAINERS 2>/dev/null || true
  else
    echo "No containers found with label 'forge.project'."
  fi
fi

# Reset DB states via Bun
if command -v bun >/dev/null 2>&1; then
  echo "Invoking database reset script..."
  bun run ./scripts/cleanup-containers.ts || true
fi

echo "=========================================="
echo " Cleanup complete."
echo "=========================================="
