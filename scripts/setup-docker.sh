#!/usr/bin/env bash
set -euo pipefail

echo "==> Setting up Forge Docker environment..."

# 1. Create the isolated sandbox network
docker network create forge-sandbox 2>/dev/null || true

# 2. Create projects root directory
mkdir -p .data/projects
if [ "$(id -u)" -eq 0 ]; then
  mkdir -p /var/app/data/projects 2>/dev/null || true
  chown -R 1000:1000 /var/app/data/projects 2>/dev/null || true
elif command -v sudo >/dev/null 2>&1 && sudo -n true 2>/dev/null; then
  sudo mkdir -p /var/app/data/projects 2>/dev/null || true
  sudo chown -R 1000:1000 /var/app/data/projects 2>/dev/null || true
fi

# 3. Build sandbox images for each supported framework
for fw in fastapi flask express nestjs hono fastify; do
  if [ -f "./sandbox-images/$fw.Dockerfile" ]; then
    echo "==> Building image forge-sandbox-$fw:latest..."
    docker build -t "forge-sandbox-$fw:latest" -f "./sandbox-images/$fw.Dockerfile" .
  fi
done

# 4. Verify
echo "==> Verifying Docker Network:"
docker network ls | grep forge-sandbox || true

echo "==> Verifying Forge Sandbox Images:"
docker images | grep forge-sandbox || true

echo "==> Docker setup complete!"
