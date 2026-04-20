# Internal Project Knowledge (IPK) — Claude Code Context

Đây là file context cho Claude CLI (Claude Code). Đọc file này trước khi làm bất kỳ task nào.

## Dự án là gì

IPK là AI-powered knowledge management system cho SolidBytes.
- Nhân viên SB làm việc shadow dưới tên sếp (Steven Cao) với nhiều client
- Mỗi client có Slack workspace riêng — nhân viên cần nắm context nhanh
- Hệ thống tự động pull @mention từ Slack client (qua n8n), draft reply, lưu meeting notes

## Tech stack

- **Frontend + Backend**: Next.js 14 App Router, TypeScript
- **Database**: SQLite (better-sqlite3) — file tại `./data/brain.db`
- **AI**: Google Gemini API (`gemini-2.0-flash`) — xem `lib/ai.ts`
- **Transcription**: Google Gemini (multimodal audio), fallback Whisper local — xem `lib/transcribe.ts`
- **Slack webhook**: n8n tại `https://auto-n8n.solidbytes.vn/` → POST `/api/webhook/slack`
- **Styling**: Tailwind CSS + CSS variables dark theme

## Cấu trúc thư mục

```
lib/
  db.ts          ← toàn bộ SQLite queries, schema auto-migrate
  ai.ts          ← Gemini API: draftReply, chatWithContext, processMeetingNotes, processUploadedText
  transcribe.ts  ← ffmpeg extract audio + local Whisper
  types.ts       ← TypeScript interfaces

app/api/
  projects/      ← CRUD projects
  knowledge/     ← CRUD knowledge pages
  meetings/      ← CRUD + AI process meetings
  slack-feed/    ← CRUD + PATCH status + POST regenerate draft
  webhook/zapier ← nhận từ n8n (tên giữ nguyên dù dùng n8n)
  upload/        ← text upload + video upload
  chat/          ← chat với AI
  seed/          ← demo data

components/
  AppShell.tsx      ← layout chính, state management
  Sidebar.tsx       ← danh sách projects
  TopBar.tsx        ← tab navigation
  SlackFeed.tsx     ← list @mentions
  ReplyPanel.tsx    ← draft reply, copy & done, flag sếp
  SourcesPanel.tsx  ← unified sources (knowledge + meetings), add/edit/delete
  ChatModule.tsx    ← chat interface with citations + copy
```

## Nguyên tắc quan trọng

1. **Human-in-the-loop**: AI không tự gửi gì — mọi action cần người approve
2. **SQLite**: dùng `getDb()` từ `lib/db.ts`, không raw query
3. **Dark theme**: CSS variables `--bg0` đến `--bg4`, `--tx0` đến `--tx2`
4. **API error format**: `{ error: string }` với status code phù hợp
5. **n8n webhook**: endpoint `/api/webhook/slack` nhận từ n8n của Nghị

## Env vars cần thiết

```
GEMINI_API_KEY=...              # Google Gemini (free tại aistudio.google.com)
ZAPIER_WEBHOOK_SECRET=...       # n8n webhook auth
# Whisper chạy local, không cần API key — cài: pip install openai-whisper
```
