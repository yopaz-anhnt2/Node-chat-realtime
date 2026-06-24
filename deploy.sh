#!/usr/bin/env bash
#
# Deploy: pull code mới -> cài deps -> build CSS -> migrate DB -> restart service.
# Các bước nặng chạy TRƯỚC, chỉ restart ở cuối nên gián đoạn ~1-2s
# (client Socket.IO tự kết nối lại).
#
# Dùng:  ./deploy.sh

set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/node-chat-realtime}"
SERVICE="${SERVICE:-chat-node}"

cd "$APP_DIR"

echo "==> [1/5] Lấy code mới (git pull)"
git pull

echo "==> [2/5] Cài dependencies"
npm ci                       # cần cả devDeps vì sequelize-cli (migrate) ở devDependencies

echo "==> [3/5] Build CSS (Tailwind)"
npm run build:css

echo "==> [4/5] Migrate DB"
npm run db:migrate

echo "==> [5/5] Restart service: $SERVICE"
sudo systemctl restart "$SERVICE"

sleep 1
sudo systemctl --no-pager status "$SERVICE" | head -n 6
echo "✅ Deploy xong."
