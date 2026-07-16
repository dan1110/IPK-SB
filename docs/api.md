# API Contracts — IPK

Mọi route: JSON in/out, lỗi trả `{ "error": string }` với status code phù hợp (400 thiếu param, 404 không tồn tại, 401 sai secret, 500 lỗi xử lý). Tất cả đều `force-dynamic`.

## Projects

| Method | Path | Body / Query | Trả về |
|---|---|---|---|
| GET | `/api/projects` | header `X-User-Id` (optional) | Danh sách project + `pending_count`. Non-boss chỉ thấy project được assign; boss/không header → tất cả |
| POST | `/api/projects` | `{name, color?, slack_workspace?, tool?}` | Project mới, 201 |
| GET/PUT/DELETE | `/api/projects/:id` | PUT: partial fields | Project / updated / deleted |

## Knowledge

| Method | Path | Body / Query |
|---|---|---|
| GET | `/api/knowledge?project_id=&q=` | `q` → search LIKE title/content |
| POST | `/api/knowledge` | `{project_id, title, content?, source?}` → 201 |
| PUT/DELETE | `/api/knowledge/:id` | PUT: partial |

## Meetings

| Method | Path | Body / Query |
|---|---|---|
| GET | `/api/meetings?project_id=` | |
| POST | `/api/meetings` | `{project_id, raw_text?, title?, date?, uploaded_by?}` — có `raw_text` + GEMINI_API_KEY → AI xử lý thành biên bản + auto-update knowledge; không thì tạo manual từ `{transcript, translation, summary, action_items, key_decisions}` |
| GET/PUT/DELETE | `/api/meetings/:id` | |

## Slack Feed

| Method | Path | Body / Query |
|---|---|---|
| GET | `/api/slack-feed?project_id=&status=all` | status: pending/replied/flagged/dismissed/all |
| POST | `/api/slack-feed` | `{project_id, from_name, from_initials?, channel, workspace, message}` — auto-tag + auto-draft nếu có key |
| PATCH | `/api/slack-feed/:id` | `{action}` (replied/approved/flagged/dismissed/pending, flagged kèm `flagged_by?/flagged_to?`) hoặc `{draft_reply}` hoặc `{tags}` |
| POST | `/api/slack-feed/:id` | Regenerate draft reply |

## Chat

| Method | Path | Body / Query |
|---|---|---|
| GET | `/api/chat?project_id=` | Lịch sử |
| POST | `/api/chat` | `{project_id, message}` → `{reply}`. Context = knowledge + meetings + jira + top-8 code files liên quan. Gửi 10 message gần nhất |
| DELETE | `/api/chat?project_id=` | Xoá lịch sử |

## Upload

| Method | Path | Body |
|---|---|---|
| POST | `/api/upload` | `{project_id, content}` → AI phân loại vào knowledge pages, trả `{summary, updates, creates}` |
| POST | `/api/upload/file` | multipart `file` + `project_id` — `.pdf/.txt/.md`, max 20MB |
| POST | `/api/upload/video` | multipart `file` + `project_id` + `title?` + `language?` + `uploaded_by?` — mp4/webm/mov/mp3/wav/flac/m4a, max 500MB, `maxDuration=300`. Pipeline: extract audio → transcribe → biên bản họp → meeting + knowledge |
| POST | `/api/upload/drive` | `{url, project_id, title?, language?}` — download từ Google Drive rồi chạy pipeline như video |
| GET/POST | `/api/upload/tone` | Tone profile per project: `{samples[], style_notes, salutation}` |

## Users / Assignments / Activity / Dashboard

| Method | Path | Ghi chú |
|---|---|---|
| GET/POST | `/api/users` | POST 409 nếu trùng email. DELETE `/:id` = soft-delete (`active=0`) |
| GET/PUT/DELETE | `/api/users/:id` | |
| GET/POST/DELETE | `/api/assignments` | GET `?project_id` hoặc `?user_id`; DELETE `?user_id&project_id` |
| GET | `/api/activity?project_id=\|user_id=&limit=50` | |
| GET | `/api/dashboard` | `{overview, projects, flagged, activity}` |

## Jira / GitHub / Integrations

| Method | Path | Ghi chú |
|---|---|---|
| GET | `/api/jira?project_id=&status=all` | `{tickets, stats, riskCount}` |
| GET/PUT | `/api/jira/:id` | PUT: `{risk_level?, risk_reason?}` |
| GET/POST | `/api/github` | POST: `{project_id, repo_url, default_branch?}` |
| GET/DELETE | `/api/github/:repoId` | GET trả repo + files |
| GET | `/api/github/:repoId/files?q=` | Metadata (không kèm content) |
| GET/POST | `/api/integrations` | POST: `{project_id, type, label?, config?, n8n_webhook_url?}` |
| PUT/DELETE | `/api/integrations/:id` | |

## Webhooks (n8n → IPK)

**Auth**: so `secret` trong **body** với env `ZAPIER_WEBHOOK_SECRET` → sai trả 401. ⚠️ Nếu env không set thì **bỏ qua auth hoàn toàn** (fail-open) — production BẮT BUỘC phải set. Riêng `/api/n8n` nhận secret qua **query string** `?secret=`.

| Path | Body | Làm gì |
|---|---|---|
| POST `/api/webhook/slack` | `{workspace, from_name, channel, message, secret, project_id?}` | Nhận @mention. Map project theo `project_id` hoặc match `slack_workspace` (case-insensitive). Auto-tag + auto-draft |
| POST `/api/webhook/slack-knowledge` | `{workspace\|project_id, channel, messages[{from,text,ts}], secret}` | Chắt knowledge từ batch tin nhắn Slack |
| POST `/api/webhook/jira` | `{project_id, tickets[], secret}` | Upsert tickets + AI phân tích risk |
| POST `/api/webhook/github` | `{project_id, repo_url, files[{path,content}], secret}` | Sync code files |
| GET `/api/n8n?secret=&workspace=?` | | Mapping workspace → project_id cho n8n |

## Khác

| Path | Ghi chú |
|---|---|
| POST `/api/seed` | Demo data (3 users, 4 projects). Idempotent — đã có project thì bỏ qua |
| POST `/api/translate` | Dịch nội dung (Gemini) |

## Quy tắc khi thêm route mới

1. `export const dynamic = 'force-dynamic'` ở đầu file.
2. Query qua `db.*` từ `lib/db.ts` — không raw SQL.
3. Lỗi: `NextResponse.json({ error: '...' }, { status: 4xx/5xx })`.
4. Thiếu `GEMINI_API_KEY` → fallback nhẹ nhàng, không throw.
5. Dynamic segment: dùng async params (`{ params }: { params: Promise<{id: string}> }` + `await params`) cho route mới — codebase đang lẫn 2 kiểu, kiểu async là chuẩn đi tới.
6. Cập nhật file này trong cùng PR.
