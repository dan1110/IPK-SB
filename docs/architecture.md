# Architecture — IPK

## Tổng quan

Monolith Next.js 14 (App Router) — frontend, API, và AI orchestration trong cùng một app. Database là SQLite file, AI là Google Gemini gọi qua REST. Không có service riêng, không có queue.

```
┌─ Slack của client ─┐
│  @mention Steven    │
└─────────┬───────────┘
          │ event
     ┌────▼────┐         ┌──────────────── IPK (Next.js) ────────────────┐
     │   n8n   │ POST    │  app/api/webhook/*   ← ingestion (secret auth) │
     │ (Nghị)  ├────────▶│  app/api/*           ← CRUD + AI endpoints     │
     └─────────┘         │  lib/ai.ts           ← Gemini REST             │
                         │  lib/transcribe.ts   ← ffmpeg + Gemini/Whisper │
                         │  lib/db.ts           ← better-sqlite3          │
                         │        │                                       │
                         │  data/brain.db (SQLite, WAL)                   │
                         │        ▲                                       │
                         │  components/* ← React UI (client components)   │
                         └────────────────────────────────────────────────┘
```

## Các layer

### 1. Data layer — `lib/db.ts`
- Singleton `getDb()`: mở `data/brain.db` (hoặc `DATABASE_PATH`), bật WAL + foreign keys, chạy auto-migrate.
- **Auto-migrate 2 pha**: pha 1 là `CREATE TABLE IF NOT EXISTS` cho mọi bảng; pha 2 là additive `ALTER TABLE ADD COLUMN` (check qua `pragma table_info`) cho DB cũ. Thêm cột mới = thêm vào cả 2 pha.
- Export object `db` namespaced theo bảng (`db.projects`, `db.slack`, `db.knowledge`...) — **mọi query đi qua đây, không raw SQL trong route**.

### 2. Tables (13 bảng)

| Bảng | Vai trò |
|---|---|
| `projects` | Client/dự án — silo gốc, mọi thứ FK về đây (ON DELETE CASCADE) |
| `knowledge_pages` | Trang knowledge, `source`: manual/upload/meeting/slack |
| `meetings` | Meeting notes: transcript, translation, summary, action_items (JSON), key_decisions (JSON) |
| `slack_messages` | Mention từ n8n: status pending/replied/flagged/dismissed, draft_reply, tags (JSON) |
| `chat_messages` | Lịch sử chat AI theo project |
| `tone_profiles` | Giọng văn của Steven theo project (samples, style_notes) — 1 profile/project |
| `jira_tickets` | Ticket sync từ n8n, có risk_level do AI phân tích |
| `github_repos` / `github_files` | Code sync từ n8n — nguồn context code cho chat |
| `users` | boss/lead/employee, soft-delete qua `active` |
| `project_assignments` | User thuộc project nào, role lead/member |
| `activity_log` | Audit trail hành động |
| `project_integrations` | Cấu hình integration per project (type, config JSON, n8n webhook URL) |

Lưu ý: nhiều field kiểu "mảng" lưu là **JSON string trong cột TEXT** (`tags`, `action_items`, `labels`...) — parse ở tầng đọc.

### 3. AI layer — `lib/ai.ts`
- Gemini REST (`GEMINI_MODEL`, default `gemini-2.0-flash-lite`), 2 helper: `gemini()` (one-shot) và `geminiChat()` (history).
- Các function chính: `draftReply` (soạn reply Slack theo tone), `chatWithContext` (RAG chat có citation `[Source: ...]`), `processMeetingNotes` (biên bản họp EN + dịch VI), `processUploadedText` / `processSlackKnowledge` (phân loại nội dung vào knowledge pages), `analyzeJiraRisks`.
- `buildContext()` ghép knowledge + meetings + jira + code thành context string. `buildCodeContext()` chọn top 8 file code liên quan bằng keyword scoring (không dùng LLM).
- **Graceful degradation**: thiếu `GEMINI_API_KEY` → app vẫn chạy, các feature AI trả fallback thay vì crash.

### 4. Transcription — `lib/transcribe.ts`
```
video → ffmpeg extract WAV (mono 16kHz) → convert MP3 64k
      → Gemini (inline base64 nếu <10MB, File API nếu lớn hơn)
      → fallback: Whisper local (--model base) nếu Gemini fail/thiếu key
```
Chạy bằng `execSync` — cần `ffmpeg` trong môi trường (Docker image đã cài).

### 5. API layer — `app/api/*`
Tất cả route đều `export const dynamic = 'force-dynamic'`. Chi tiết contract xem [api.md](./api.md). Nhóm chính:
- CRUD: projects, knowledge, meetings, users, assignments, integrations, jira, github
- AI actions: chat, slack-feed regenerate, upload (text/file/video/drive), translate
- Ingestion: `webhook/slack`, `webhook/slack-knowledge`, `webhook/jira`, `webhook/github` — auth bằng shared secret `ZAPIER_WEBHOOK_SECRET`
- Utility: `n8n` (mapping workspace → project cho n8n), `seed` (demo data, idempotent), `dashboard`

### 6. Frontend — `components/*`
Một page duy nhất (`app/page.tsx` → `AppShell`), điều hướng bằng state chứ không phải route:
- `AppShell` giữ `viewMode` (project / dashboard / users) + `activeTab` (knowledge / slack / tool / settings)
- Knowledge tab = `SourcesPanel` (trái) + `ChatModule` (phải)
- Slack tab = `SlackFeed` (trái) + `ReplyPanel` (phải)
- Tool tab = `JiraBoard`; Home (boss/lead) = `BossDashboard`; Users = `UserManager`
- `app/demo` = design system showcase, tách biệt app chính

### 7. Auth & permissions (Phase 1 — tối giản)
- Login chỉ là chọn role, lưu localStorage (`lib/role-context.tsx`). Identity gửi lên server qua header `X-User-Id`.
- `lib/permissions.ts` là các predicate theo role (boss/lead/employee) — **enforce chủ yếu ở UI**; server mới chỉ dùng ở `GET /api/projects` (filter project theo assignment).
- JWT/session thật là việc của Phase 4. **Đừng nhầm đây là bảo mật thật** — xem [troubleshooting.md](./troubleshooting.md).

## Quyết định kiến trúc & lý do

| Quyết định | Lý do |
|---|---|
| SQLite thay vì Postgres | Tool nội bộ, ít user đồng thời, deploy 1 container + 1 volume là xong |
| n8n ở ngoài thay vì Slack API trực tiếp | Slack app cần approve từng workspace client; n8n dùng account của Steven, linh hoạt hơn |
| AI không tự gửi reply | Nguyên tắc human-in-the-loop — rủi ro nói sai với client dưới tên Steven quá lớn |
| Gemini thay vì Claude/GPT | Free tier đủ dùng, multimodal audio transcription tích hợp luôn |
| State-based navigation thay vì routes | App dạng dashboard 1 màn hình, đơn giản hoá; trade-off: không deep-link được |
