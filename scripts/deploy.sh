#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/opt/wishwe"
BACKEND_DIR="$APP_DIR/backend"
VENV_DIR="$BACKEND_DIR/venv"

echo "==> Updating the code from Git"
cd "$APP_DIR"
git fetch origin
git reset --hard origin/main

echo "==> Updating dependencies"
cd "$BACKEND_DIR"
source "$VENV_DIR/bin/activate"
pip install --upgrade pip
pip install -r requirements.txt

echo "==> Restarting celery services"
sudo systemctl restart celery-worker
sudo systemctl restart celery-beat

echo "==> Checking status"
sudo systemctl is-active --quiet celery-worker && echo "celery-worker: OK" || { echo "celery-worker: FAILED"; exit 1; }
sudo systemctl is-active --quiet celery-beat && echo "celery-beat: OK" || { echo "celery-beat: FAILED"; exit 1; }

echo "==> Deployment completed successfully"