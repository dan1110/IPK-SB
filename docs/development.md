# Development — Setup & Workflow

## Setup lần đầu

```bash
git clone git@github.com:dan1110/IPK-SB.git && cd IPK-SB
npm install                # cần python3/make/g++ cho better-sqlite3 (macOS: có sẵn qua Xcode CLT)
cp .env.local.example .env.local
```

`.env.local` tối thiểu:

```
GEMINI_API_KEY=...          # lấy free tại aistudio.google.com — thiếu thì AI features tắt nhưng app vẫn chạy
GEMINI_MODEL=gemini-2.0-flash   # optional, default gemini-2.0-flash-lite
ZAPIER_WEBHOOK_SECRET=...   # secret cho webhook n8n — dev local có thể bỏ trống (auth sẽ skip)
```

Công cụ ngoài (cho transcription):
```bash
brew install ffmpeg                 # bắt buộc nếu làm feature video/audio
pip install openai-whisper          # optional — fallback khi Gemini fail
```

Chạy:
```bash
npm run dev                          # http://localhost:3000
curl -X POST localhost:3000/api/seed # demo data (idempotent)
```

DB nằm ở `data/brain.db` — xoá file này là reset sạch (seed lại được).

## Quy trình làm việc

### Vòng lặp hằng tuần
1. **Weekly review** — chạy skill `/weekly-review` trong Claude Code: đánh giá tiến độ, lên kế hoạch 2 tuần, tạo GitHub issues (sau khi được duyệt). Báo cáo lưu `docs/reports/`.
2. Member nhận issue từ board.

### Issue convention (bắt buộc)

Title: `[X][Y][Z] Tên issue`

| Phần | Giá trị | Ý nghĩa |
|---|---|---|
| `[X]` | 1, 2, 3... | Mã số tăng dần của dự án (không phải số GitHub tự sinh). Lấy max hiện có +1 |
| `[Y]` | `BE` `FE` `FS` `AI` `OPS` `DOCS` | Vai trò |
| `[Z]` | `Feature` `Bug` `Chore` | Loại |

Ví dụ: `[12][FE][Feature] Trang Client Brief tự động`

Label: `role:<Y>` + `type:<Z>`. Tạo issue lẻ giữa tuần → skill `/new-issue`.

### Quy tắc FE
Issue `[FE]` có UI mới **bắt buộc bám design system** ([coding-standard.md](./coding-standard.md)) — dùng CSS variables, không hardcode màu, theo pattern/token của `design-system/MASTER.md`.

Có design tham chiếu trước khi code là **khuyến khích** (dễ align, đỡ làm lại), nhưng **không bắt buộc**. Chọn cách nào tùy issue:
- **Stitch** — skill `/stitch-design`, tiện khi cần dựng nhanh một trang mới hoàn chỉnh.
- **Bám component/trang có sẵn** — hầu hết UI mới chỉ cần tái dùng pattern đang có.
- **Mockup/Figma/mô tả trong issue** — cũng được.

Điền cách tiếp cận vào mục Design của issue (kể cả "theo pattern của X" hay "không cần mockup").

### Vòng đời một issue

Skill `/work-issue <N>` chạy trọn luồng này (đổi `status:*` label theo từng bước). Tóm tắt:

```
Lấy issue (status:in-progress) → plan → (block: comment + status:blocked)
→ (FE: xác định hướng design — pattern có sẵn / Stitch / mockup)
→ code theo coding-standard.md
→ test local: typecheck + build + verify theo testing.md
→ branch: <type>/<X>-<mô-tả-ngắn>   vd: feature/12-client-brief
→ commit Conventional Commits (feat:/fix:/chore:/refactor: + scope optional)
→ push + PR (Closes #<số GitHub>, status:in-review)
→ PR merge → issue tự đóng; cập nhật docs nếu hành vi đổi (cùng PR)
```

### Test webhook local (không cần n8n thật)

```bash
curl -X POST localhost:3000/api/webhook/slack \
  -H 'Content-Type: application/json' \
  -d '{
    "workspace": "intentwave",
    "from_name": "John Client",
    "channel": "#general",
    "message": "Hey Steven, can you review the proposal by Friday?",
    "secret": "<ZAPIER_WEBHOOK_SECRET của bạn hoặc bỏ nếu env trống>"
  }'
```

`workspace` phải match `slack_workspace` của một project (xem `GET /api/n8n?secret=...` để list mapping).

## Claude Code trong dự án này

- `CLAUDE.md` (root) là context tự nạp — đọc trước khi làm gì.
- Skills: `/weekly-review`, `/new-issue`, `/stitch-design` (trong `.claude/skills/`).
- `PROMPTS.md` là playbook prompt theo phase — tham khảo khi làm feature lớn.

## Scripts hữu ích

```bash
npx tsc --noEmit                 # typecheck
npx tsx scripts/test-stt.ts      # test transcription config (cần ffmpeg)
npx tsx scripts/test-video.ts    # test e2e upload video (cần dev server đang chạy)
sqlite3 data/brain.db '.tables'  # inspect DB
```
