# Project Brain

AI-powered knowledge management system for SolidBytes — bộ não số cho từng dự án.

## Quick Start

### 1. Install
```bash
npm install
```

### 2. Setup environment
```bash
cp .env.local.example .env.local
```
Mở `.env.local` và điền:
```
ANTHROPIC_API_KEY=sk-ant-xxxxxxxx   # lấy từ console.anthropic.com
ZAPIER_WEBHOOK_SECRET=any-secret    # tự đặt, dùng trong Zapier
```

### 3. Run
```bash
npm run dev
```
Mở [http://localhost:3000](http://localhost:3000)

Demo data sẽ tự seed khi load lần đầu (neopets, intentwave, yotta, theory projects).

---

## Features

| Tab | Chức năng |
|-----|-----------|
| **Slack Feed** | @mentions từ Zapier — xem, approve, copy-paste reply |
| **Knowledge** | Wiki pages tự động — upload text/PDF để AI phân loại |
| **Meetings** | Paste transcript — AI tạo summary + action items + decisions |
| **Chat** | Hỏi AI dựa trên toàn bộ knowledge + meetings |

---

## Zapier Setup (Option B)

### Cách setup 1 Zap cho 1 client workspace:

1. Vào [zapier.com](https://zapier.com) → Create Zap
2. **Trigger:** Slack → "New Mention of You"
   - Connect Steven's Slack account
   - Workspace: chọn client workspace (e.g. neopets.slack.com)
3. **Filter (optional):** chỉ lấy message từ channel cụ thể
4. **Action:** HTTP Request (n8n) → POST
   - URL: `http://your-domain.com/api/webhook/slack`
   - Payload Type: `json`
   - Data:
     ```
     project_id  →  [hardcode project ID từ DB]
     from_name   →  {{User Display Name}}
     channel     →  {{Channel Name}}
     workspace   →  neopets.slack.com
     message     →  {{Text}}
     secret      →  [ZAPIER_WEBHOOK_SECRET từ .env]
     ```
5. Test → Turn on

Lặp lại cho mỗi client workspace. Mỗi Zap ~15 phút setup.

### Lấy project ID:
```bash
# Chạy trong terminal sau khi start app
curl http://localhost:3000/api/projects
```

---

## API Endpoints

### Projects
```
GET    /api/projects              # list all
POST   /api/projects              # create {name, color, slack_workspace}
PUT    /api/projects/:id          # update
DELETE /api/projects/:id          # delete
```

### Knowledge Pages
```
GET    /api/knowledge?project_id= # list (supports ?q= for search)
POST   /api/knowledge             # create {project_id, title, content}
PUT    /api/knowledge/:id         # update
DELETE /api/knowledge/:id         # delete
POST   /api/upload                # process text with AI {project_id, content}
```

### Meetings
```
GET    /api/meetings?project_id=  # list
POST   /api/meetings              # create or AI-process {project_id, raw_text, title, date}
DELETE /api/meetings/:id          # delete
```

### Slack Feed
```
GET    /api/slack-feed?project_id= [&status=pending|replied|flagged]
POST   /api/slack-feed             # manual add {project_id, from_name, channel, workspace, message}
PATCH  /api/slack-feed/:id         # {action: replied|flagged|dismissed|pending} or {draft_reply: "..."}
POST   /api/slack-feed/:id         # regenerate AI draft reply
```

### n8n Slack Webhook
```
POST   /api/webhook/slack         # receives from n8n (SolidBytes)
       Body: {project_id, from_name, channel, workspace, message, secret}
```

### Chat
```
GET    /api/chat?project_id=       # chat history
POST   /api/chat                   # send message {project_id, message}
DELETE /api/chat?project_id=       # clear history
```

### Tone Profile
```
GET    /api/upload/tone?project_id=
POST   /api/upload/tone            # {project_id, samples[], style_notes, salutation}
```

---

## Project Structure

```
project-brain/
├── app/
│   ├── api/                    # All API routes
│   │   ├── projects/
│   │   ├── knowledge/
│   │   ├── meetings/
│   │   ├── slack-feed/
│   │   ├── webhook/slack/      # ← n8n posts here
│   │   ├── chat/
│   │   ├── upload/
│   │   └── seed/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── AppShell.tsx            # Main layout
│   ├── Sidebar.tsx             # Project list
│   ├── TopBar.tsx              # Tab navigation
│   ├── SlackFeed.tsx           # @mentions list
│   ├── ReplyPanel.tsx          # Draft reply area
│   ├── KnowledgePages.tsx      # Wiki pages
│   ├── MeetingNotes.tsx        # Meeting notes
│   └── ChatModule.tsx          # AI chat
├── lib/
│   ├── db.ts                   # SQLite (better-sqlite3)
│   ├── ai.ts                   # Anthropic API helpers
│   └── types.ts                # TypeScript types
├── data/
│   └── brain.db                # SQLite file (auto-created)
└── .env.local                  # API keys
```

---

## Phase 2 Roadmap (sau khi Phase 1 stable)

- [ ] Jira integration — kéo tickets vào project context
- [ ] n8n webhook support — nhận data từ Nghị's workflows
- [ ] File upload (PDF parse) — không cần copy-paste text
- [ ] Video upload → Google Speech-to-Text → auto transcript
- [ ] GitHub MCP — hỏi về source code
- [ ] Multi-user permissions — nhân viên chỉ thấy project được assign
- [ ] Email notification — khi có @mention mới

## Phase 3 Roadmap

- [ ] Swap Claude API → local LLM (Ollama + llama3 hoặc mistral)
- [ ] Swap Google STT → Whisper local
- [ ] Full offline mode
