# Troubleshooting — Known Issues

Gặp lỗi mất >30 phút để giải → thêm vào đây (triệu chứng → nguyên nhân → cách xử lý).

## Env vars không nhất quán giữa các file (bẫy kinh điển)

**Triệu chứng**: làm theo README/.env.local.example mà AI không chạy.
**Nguyên nhân**: tài liệu cũ lệch nhau — `.env.local.example` và README nhắc `ANTHROPIC_API_KEY`/`GOOGLE_STT_API_KEY`, nhưng **code thực tế chỉ đọc `GEMINI_API_KEY`, `GEMINI_MODEL`, `ZAPIER_WEBHOOK_SECRET`, `DATABASE_PATH`** (docker-compose đúng với code).
**Xử lý**: set theo code, tin [development.md](./development.md), không tin README cũ.

## Webhook nhận được nhưng không tạo mention

- `workspace` trong payload không match `slack_workspace` của project nào (so case-insensitive nhưng phải đúng chuỗi). Check mapping: `GET /api/n8n?secret=...`.
- Project bị xoá nhưng n8n vẫn gửi → 404.
- Trả 401 → secret trong body khác `ZAPIER_WEBHOOK_SECRET` trên server.

## Webhook "chạy được" ở local nhưng đó là ảo giác an toàn

Auth webhook là **fail-open**: `ZAPIER_WEBHOOK_SECRET` không set → mọi request được nhận, không 401. Local thì tiện, **production quên set là ai cũng bơm data giả vào được**. Luôn kiểm tra env này sau deploy.

## Gemini lỗi / draft không sinh ra

- App **không crash khi thiếu key** — feature AI chỉ im lặng fallback (chat trả "AI not configured", mention không có draft). Thấy "AI không làm gì" thì check `GEMINI_API_KEY` trước tiên.
- Free tier rate limit → lỗi `Gemini API error: ...` trong server log. Đợi hoặc đổi key/model (`GEMINI_MODEL=gemini-2.0-flash`).
- Model default là `gemini-2.0-flash-lite` (không phải `gemini-2.0-flash` như CLAUDE.md từng ghi).

## Transcription fail

Thứ tự pipeline: Gemini → fallback Whisper local. Kết quả bắt đầu bằng `[` (vd `[Whisper not installed...]`) nghĩa là lỗi, không phải transcript.
- `ffmpeg not found` → `brew install ffmpeg` (local) / kiểm tra Docker image.
- Whisper fallback cần `pip install openai-whisper`; app tìm ở `.venv/bin/whisper` trước, rồi global.
- File >10MB dùng Gemini File API — chậm hơn, có sleep 2s chờ xử lý.
- Video dài: route có `maxDuration=300` (5 phút) — video quá dài sẽ timeout.

## better-sqlite3 không build được (`npm install` fail)

Native module cần toolchain: macOS cài Xcode Command Line Tools; Alpine/Docker cần `python3 make g++` (Dockerfile đã có). Đổi version Node → `npm rebuild better-sqlite3`.

## DB lock / data lạ

- SQLite chạy WAL — file `brain.db-wal`/`brain.db-shm` là bình thường, đừng xoá riêng lẻ khi app đang chạy.
- Reset sạch dev: tắt server → xoá `data/brain.db*` → chạy lại → `POST /api/seed`.
- Copy DB đang chạy để backup phải copy cả 3 file (hoặc dừng app trước).

## UI: màu "kẹt" khi toggle dark/light

Dấu hiệu component hardcode hex thay vì CSS var. App dùng class `.dark` trên `<html>` (KHÔNG phải `data-theme` — cái đó chỉ dùng ở `/demo`). Sửa: thay hex bằng `var(--color-*)`.

## Hai hệ token CSS song song

`design-system/tokens.css` (dùng `[data-theme]`, chỉ import ở `/demo`) và `app/globals.css` (dùng `.dark`, app thật load). Cùng bộ giá trị `--color-*` nhưng **globals.css mới là nguồn app dùng**, kèm alias legacy `--bg0..4`/`--tx0..2`. Sửa token phải sửa `globals.css`; sửa `tokens.css` sẽ "không thấy gì thay đổi".

## Login/permission hoạt động lạ

Auth Phase-1: role lưu localStorage (`ipk-login-role`, `ipk-current-user-id`), server chỉ nhận header `X-User-Id`, hầu hết route **không enforce quyền server-side** (chỉ UI ẩn nút). Đây là known limitation, không phải bug — đừng dựa vào nó như bảo mật thật.

## Route param `undefined` trong dynamic route

Codebase lẫn 2 kiểu params: sync (`{params: {id}}`) và async (`{params: Promise<...>}` + `await` — ở `github/[repoId]`, `jira/[id]`). Copy route cũ làm mẫu thì kiểm tra kiểu params trước khi debug hướng khác.
