#!/usr/bin/env bash
# 将 dist/ 目录发布到 gh-pages 分支（Gitee / GitHub 都会推送，存在的 remote 才推）。
# 用法：npm run deploy:pages
set -euo pipefail
cd "$(dirname "$0")/.."

if [ ! -f dist/index.html ]; then
  echo "dist/index.html 不存在，请先执行 npm run build" >&2
  exit 1
fi

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

cd - >/dev/null
for remote in origin github; do
  if git remote get-url "$remote" >/dev/null 2>&1; then
    url=$(git remote get-url "$remote")
    echo "==> 推送到 $remote ($url)"
    git -C "$TMP_DIR" push -f "$url" gh-pages
  fi
done

echo "完成。GitHub Pages 会自动生效；Gitee Pages 已下线，无需再管。"
