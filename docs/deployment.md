# Deployment — CI/CD & Release

## Kiến trúc deploy

Docker single-container trên VPS, SQLite persist qua volume.

- **Dockerfile**: `node:20-alpine`, cài `ffmpeg python3 make g++` (ffmpeg cho transcription; python/make/g++ để build native `better-sqlite3`), `npm ci` → `npm run build` → `npm start`, expose 3000.
- **docker-compose.yml**: service `web`, port `3000:3000`, volume `./data:/app/data` (⚠️ đây là toàn bộ database — mất volume là mất data), `restart: always`, env passthrough `GEMINI_API_KEY` + `ZAPIER_WEBHOOK_SECRET`.

## Release thủ công (hiện tại)

Trên VPS:

```bash
./scripts/deploy.sh
# = git pull → docker-compose down → build → up -d
```

Lưu ý: có downtime ngắn giữa `down` và `up`. n8n gọi webhook trong khoảng đó sẽ fail — n8n có retry, nhưng tránh deploy giờ client hoạt động mạnh.

## Checklist trước khi deploy

1. `npx tsc --noEmit` + `npm run build` pass trên local.
2. Nếu có migration DB: đã test cả DB mới lẫn DB cũ (xem [testing.md](./testing.md)).
3. Env trên VPS đủ: `GEMINI_API_KEY`, `ZAPIER_WEBHOOK_SECRET` (**bắt buộc** — thiếu là webhook mở toang không auth), `GEMINI_MODEL` nếu muốn override.
4. **Backup DB trước deploy có migration**: `cp data/brain.db data/brain.db.bak-$(date +%F)` (nhớ cả file `-wal`/`-shm` nếu app đang chạy — an toàn nhất là backup sau khi `down`).

## Sau deploy — smoke test

```bash
curl -s https://<domain>/api/projects | head -c 200        # API sống
curl -s "https://<domain>/api/n8n?secret=$SECRET" | head    # webhook auth hoạt động
docker-compose logs --tail 50 web                            # không có error loop
```

Rồi mở UI: login → chọn project → Slack Feed load được.

## Rollback

```bash
git log --oneline -5          # tìm commit ổn định trước đó
git checkout <commit>
docker-compose down && docker-compose build && docker-compose up -d
# nếu migration làm hỏng DB: khôi phục backup
cp data/brain.db.bak-<date> data/brain.db
```

(Migration là additive-only nên DB mới thường vẫn chạy được với code cũ — cột thừa không sao.)

## CI/CD (chưa có — roadmap)

Khi tạo issue `[OPS]`:
1. GitHub Actions: typecheck + build mỗi PR (chặn merge khi fail).
2. Auto-deploy: push lên `main` → SSH vào VPS chạy `deploy.sh` (hoặc webhook).
3. Backup DB định kỳ (cron trên VPS, giữ 7 ngày).
