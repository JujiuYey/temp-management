#!/usr/bin/env bash
# 将 dist/ 目录发布到 Gitee Pages 使用的 gh-pages 分支。
# 用法：npm run build && bash scripts/deploy-pages.sh
set -euo pipefail
cd "$(dirname "$0")/.."

if [ ! -f dist/index.html ]; then
  echo "dist/index.html 不存在，请先执行 npm run build" >&2
  exit 1
fi

REMOTE_URL=$(git remote get-url origin)
AUTHOR_NAME=$(git log -1 --format=%an)
AUTHOR_EMAIL=$(git log -1 --format=%ae)
TMP_DIR=$(mktemp -d)
trap 'rm -rf "$TMP_DIR"' EXIT

cp -R dist/. "$TMP_DIR"/
touch "$TMP_DIR/.nojekyll"

cd "$TMP_DIR"
git init -q -b gh-pages
git add -A
git -c user.name="$AUTHOR_NAME" -c user.email="$AUTHOR_EMAIL" \
  commit -q -m "deploy: $(date '+%Y-%m-%d %H:%M:%S')"
git push -f "$REMOTE_URL" gh-pages

echo "已推送到 gh-pages 分支。"
echo "若 Gitee Pages 已开启，请到 仓库 → 服务 → Gitee Pages 点击「更新」使新版本生效。"
