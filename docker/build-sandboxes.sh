#!/usr/bin/env bash
set -e

echo "Building Forge Sandbox Docker Images..."

# 1. FastAPI Sandbox
echo "==> Building fastapi-sandbox:latest"
docker build -t fastapi-sandbox:latest templates/fastapi/

# 2. Express Sandbox
echo "==> Building express-sandbox:latest"
docker build -t express-sandbox:latest templates/express/

# 3. NestJS Sandbox
echo "==> Building nestjs-sandbox:latest"
docker build -t nestjs-sandbox:latest templates/nestjs/

# 4. Hono Sandbox
echo "==> Building hono-sandbox:latest"
docker build -t hono-sandbox:latest templates/hono/

# 5. Flask Sandbox
echo "==> Building flask-sandbox:latest"
docker build -t flask-sandbox:latest templates/flask/

# 6. Django Sandbox
echo "==> Building django-sandbox:latest"
docker build -t django-sandbox:latest templates/django/

echo "All Forge Sandbox Docker images built successfully!"
