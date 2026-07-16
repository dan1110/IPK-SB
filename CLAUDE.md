# Internal Project Knowledge (IPK) — Claude Code Context

Đây là file context cho Claude CLI (Claude Code). Đọc file này trước khi làm bất kỳ task nào.

## Docs — wiki của dự án

Chi tiết đầy đủ nằm ở `docs/` — **đọc file liên quan trước khi làm task**:

- `docs/README.md` — entry point + quy trình team
- `docs/business.md` — domain: mô hình shadow, vòng đời mention
- `docs/architecture.md` — kiến trúc, 13 bảng DB, data flow
- `docs/api.md` — contract mọi endpoint + quy tắc thêm route
- `docs/development.md` — setup, issue convention, test webhook local
- `docs/coding-standard.md` — convention bắt buộc (đọc trước khi viết code)
- `docs/testing.md` — verify checklist trước PR
- `docs/deployment.md` — Docker/VPS, checklist deploy, rollback
- `docs/troubleshooting.md` — known issues (check trước khi debug lâu)
- `docs/glossary.md` — thuật ngữ team

## Dự án là gì

IPK là AI-powered knowledge management system cho SolidBytes.
- Nhân viên SB làm việc shadow dưới tên sếp (Steven Cao) với nhiều client
- Mỗi client có Slack workspace riêng — nhân viên cần nắm context nhanh
- Hệ thống tự động pull @mention từ Slack client (qua n8n), draft reply, lưu meeting notes

## Tech stack

- **Frontend + Backend**: Next.js 14 App Router, TypeScript
- **Database**: SQLite (better-sqlite3) — file tại `./data/brain.db`
- **AI**: Google Gemini API (`GEMINI_MODEL`, default `gemini-2.0-flash-lite`) — xem `lib/ai.ts`
- **Transcription**: Google Gemini (multimodal audio), fallback Whisper local — xem `lib/transcribe.ts`
- **Slack webhook**: n8n tại `https://auto-n8n.solidbytes.vn/` → POST `/api/webhook/slack` (+ `slack-knowledge`, `jira`, `github`)
- **Styling**: Tailwind CSS + CSS variables, dark mode qua class `.dark`

## Quy trình team & skills

- **Issue convention**: title `[X][Y][Z] Tên` — X = mã số tăng dần, Y = BE/FE/FS/AI/OPS/DOCS, Z = Feature/Bug/Chore. Chi tiết: `docs/development.md`
- **Skills** (`.claude/skills/`):
  - `/weekly-review` — review tuần, lên kế hoạch 2 tuần, tạo GitHub issues (phải được duyệt trước khi tạo)
  - `/new-issue` — tạo issue lẻ đúng convention
  - `/work-issue <N>` — luồng chuẩn xử lý 1 issue: lấy issue → plan → (xử lý block) → implement → test local → branch → PR (`Closes #N`) → resolve. Push/PR/đóng issue hỏi xác nhận trước
  - `/stitch-design` — (tùy chọn) dựng UI mới bằng Stitch MCP khi cần design tham chiếu. Issue FE có UI mới **bắt buộc bám design system**; dùng Stitch hay không là tùy chọn

## Cấu trúc thư mục

```
lib/
  db.ts          ← toàn bộ SQLite queries, schema auto-migrate (2 pha)
  ai.ts          ← Gemini: draftReply, chatWithContext, processMeetingNotes, ...
  transcribe.ts  ← ffmpeg extract audio + Gemini/Whisper
  types.ts       ← TypeScript interfaces
  permissions.ts ← role predicates (boss/lead/employee)
  role-context.tsx ← login state (localStorage)

app/api/
  projects|knowledge|meetings|users|assignments|integrations|jira|github ← CRUD
  slack-feed/    ← mentions: CRUD + PATCH status + POST regenerate draft
  webhook/       ← slack, slack-knowledge, jira, github — nhận từ n8n, auth secret
  upload/        ← text / file (pdf,txt,md) / video / drive / tone
  chat/          ← RAG chat có citation
  dashboard/ seed/ n8n/ translate/

components/
  AppShell.tsx      ← layout chính, state-based navigation
  Sidebar.tsx TopBar.tsx
  SlackFeed.tsx ReplyPanel.tsx        ← Slack tab
  SourcesPanel.tsx ChatModule.tsx     ← Knowledge tab
  JiraBoard.tsx BossDashboard.tsx UserManager.tsx TeamManager.tsx
  ProjectSettings.tsx CreateProjectModal.tsx LoginPage.tsx ConfirmModal.tsx
```

## Nguyên tắc quan trọng

1. **Human-in-the-loop**: AI không tự gửi gì — mọi action cần người approve
2. **SQLite**: dùng `db.*` từ `lib/db.ts`, không raw query. Đổi schema = sửa cả CREATE TABLE lẫn additive migration
3. **Màu sắc**: CSS variables `--color-*` trong `app/globals.css` (alias legacy `--bg0..4`/`--tx0..2` còn dùng, code mới dùng `--color-*`). Không hardcode hex
4. **API error format**: `{ error: string }` với status code phù hợp; route mới thêm `force-dynamic`
5. **n8n webhook**: endpoint `/api/webhook/slack` nhận từ n8n của Nghị — không đổi tên endpoint/env
6. **UI mới**: bắt buộc bám design system (CSS var, token của MASTER.md); có design tham chiếu trước (Stitch/pattern có sẵn/mockup) là khuyến khích, không bắt buộc

## Env vars cần thiết

```
GEMINI_API_KEY=...              # Google Gemini (free tại aistudio.google.com)
GEMINI_MODEL=...                # optional, default gemini-2.0-flash-lite
ZAPIER_WEBHOOK_SECRET=...       # n8n webhook auth — production BẮT BUỘC (thiếu = fail-open)
# Whisper chạy local, không cần API key — cài: pip install openai-whisper
```
