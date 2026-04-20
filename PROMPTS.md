# IPK — Prompts cho Claude CLI (Claude Code)

Dùng file này khi làm việc với `claude` CLI. Copy prompt vào terminal, Claude sẽ đọc `CLAUDE.md` và hiểu context tự động.

---

## Cách dùng Claude CLI

```bash
# Cài Claude Code
npm install -g @anthropic-ai/claude-code

# Chạy trong thư mục project
cd project-brain
claude

# Hoặc chat 1 lần
claude -p "prompt của bạn ở đây"
```

> Claude CLI tự đọc `CLAUDE.md` trong thư mục — không cần giải thích lại project mỗi lần.

---

## PHASE 1 — SPRINT 1: Nền tảng & Video Upload

### Prompt 1.1 — Kiểm tra toàn bộ setup
```
Đọc toàn bộ codebase hiện tại và cho tôi biết:
1. Những file nào đã có
2. Có lỗi TypeScript hay missing dependency nào không
3. Chạy `npm run build` và báo cáo kết quả
4. Những gì cần làm thêm để Phase 1 Sprint 1 hoàn chỉnh
```

### Prompt 1.2 — Fix lỗi TypeScript / build
```
Chạy `npx tsc --noEmit` và fix toàn bộ lỗi TypeScript.
Sau đó chạy lại để confirm 0 errors.
Không thay đổi logic, chỉ fix type errors.
```

### Prompt 1.3 — Test video upload flow
```
Tôi muốn test video upload flow end-to-end.
1. Tạo 1 test script `scripts/test-video.ts` upload 1 file audio nhỏ (tạo fake file) lên /api/upload/video
2. Mock Google STT nếu không có API key (return "This is a test transcript")
3. Confirm meeting được tạo trong DB
4. In ra kết quả
```

### Prompt 1.4 — Thêm progress indicator khi upload video
```
Trong component MeetingNotes.tsx, khi user upload video:
- Hiện progress bar hoặc loading state với các bước: "uploading... → extracting audio... → transcribing... → processing with AI..."
- Dùng Server-Sent Events hoặc polling /api/meetings?project_id= để detect khi meeting mới được tạo
- Không thay đổi API routes, chỉ update UI
```

### Prompt 1.5 — Google STT setup guide
```
Tôi chưa có Google STT API key. Hãy:
1. Giải thích cách lấy key từ Google Cloud Console (step by step)
2. Tạo file `scripts/test-stt.ts` để test key với 1 đoạn audio ngắn
3. Confirm key hoạt động với tiếng Việt
```

### Prompt 1.6 — Deploy lên server
```
Tôi muốn deploy IPK lên VPS (Ubuntu 22.04).
Tạo:
1. `Dockerfile` cho production build
2. `docker-compose.yml` với volume mount cho SQLite data
3. `scripts/deploy.sh` — pull, build, restart
4. Nginx config mẫu cho reverse proxy
Lưu ý: ffmpeg phải có trong Docker image để xử lý video.
```

---

## PHASE 1 — SPRINT 2: Knowledge & Chat

### Prompt 2.1 — Kiểm tra Knowledge Pages hoạt động
```
Test toàn bộ flow Knowledge Pages:
1. Tạo project test qua API
2. Upload text mẫu (dùng curl hoặc fetch script)
3. Confirm AI phân loại đúng vào pages
4. Test search với keyword
5. Test chat module hỏi về content vừa upload
Viết script `scripts/test-knowledge.ts` chạy toàn bộ flow này.
```

### Prompt 2.2 — Cải thiện AI prompt cho upload text
```
Trong lib/ai.ts, function processUploadedText():
- AI đang đôi khi tạo quá nhiều pages nhỏ thay vì gộp vào pages có sẵn
- Thêm logic: nếu content < 200 từ và có page liên quan → append thay vì tạo mới
- Thêm field "confidence" (0-1) cho mỗi decision — nếu < 0.7 thì hỏi user
- Test với 3 loại content khác nhau và show kết quả
```

### Prompt 2.3 — Chat context quality
```
Trong lib/ai.ts, function chatWithContext():
- Hiện tại context có thể quá dài gây tốn token
- Implement smart context: chỉ load knowledge pages và meetings liên quan đến câu hỏi (dùng keyword matching)
- Max context = 8000 tokens — truncate thông minh nếu vượt
- Thêm source citations rõ ràng hơn trong response
```

### Prompt 2.4 — Tone profile UI
```
Thêm UI để sếp nhập tone profile trong Sidebar.tsx hoặc tạo component mới ToneSettings.tsx:
- Input: textarea paste 3-5 reply mẫu của sếp
- Input: style notes (formal/casual, cách xưng hô)
- Input: salutation (Hi/Dear/Hey...)
- Save qua POST /api/upload/tone
- Hiện badge "tone configured" trên project nếu đã có
```

---

## PHASE 2 — SPRINT 3: Slack via n8n

### Prompt 3.1 — Test webhook từ n8n
```
Tôi muốn test webhook endpoint trước khi Nghị setup n8n.
1. Tạo script `scripts/test-webhook.ts` simulate POST từ n8n đến /api/webhook/slack
2. Payload mẫu: from_name="John Kim", channel="#general", workspace="neopets.slack.com", message="@steven can you confirm the deadline?"
3. Confirm message xuất hiện trong Slack Feed với draft reply
4. In ra full response
```

### Prompt 3.2 — Hướng dẫn Nghị setup n8n
```
Tạo file `docs/n8n-setup.md` hướng dẫn chi tiết cho Nghị:
1. Workflow Slack → IPK webhook (screenshot steps nếu có thể mô tả)
2. Mapping fields từ Slack sang payload của /api/webhook/slack
3. Cách lấy project_id từ database để hardcode vào Zap
4. Test workflow
5. Cách thêm workspace client mới
Viết bằng tiếng Việt, đơn giản nhất có thể.
```

### Prompt 3.3 — Lọc message thông minh hơn
```
Trong /api/webhook/slack/route.ts và lib/ai.ts:
- Hiện tại tag "urgent" chỉ dựa trên keyword đơn giản
- Cải thiện autoTagMessage() dùng Claude API để phân tích intent
- Phân loại: needs_reply / information_only / action_required / low_priority
- Thêm estimated_urgency: high / medium / low
- Chỉ gọi AI nếu ANTHROPIC_API_KEY có — fallback về keyword matching
```

### Prompt 3.4 — Notification khi có message mới
```
Thêm browser notification khi có @mention mới:
1. Trong SlackFeed.tsx, poll /api/slack-feed?project_id= mỗi 30 giây
2. Nếu có message mới (so sánh với lần trước) → hiện browser notification
3. Request permission notification khi user load app lần đầu
4. Badge count trên browser tab title
Không dùng WebSocket — polling đơn giản là đủ.
```

---

## PHASE 2 — SPRINT 4: Jira + Polish

### Prompt 4.1 — Nhận data từ n8n Jira
```
Nghị sẽ POST Jira ticket data từ n8n về IPK.
1. Tạo endpoint /api/webhook/jira nhận: { project_id, ticket_id, title, description, status, assignee, due_date }
2. Lưu vào bảng mới `jira_tickets` trong SQLite
3. Hiển thị tickets trong tab mới "tasks" trong TopBar
4. AI có thể reference tickets khi chat hoặc draft reply
Tạo migration, route, và UI component cơ bản.
```

### Prompt 4.2 — Permission system
```
Thêm basic permission system:
1. Bảng `user_project_access` trong SQLite: user_id, project_id
2. Hardcode users ban đầu: ["nguyen_dan", "huyen_tram", "mai_phuong", "nghi_pham", "ngoc_thang", "quoc_khanh"]
3. Login đơn giản bằng username (không cần password — internal tool)
4. User chỉ thấy projects được assign
5. Sếp (steven) thấy tất cả
Không cần JWT phức tạp — cookie session đơn giản là đủ.
```

### Prompt 4.3 — Mobile UI
```
Kiểm tra và fix responsive UI cho màn hình nhỏ (< 768px):
1. Sidebar collapse thành bottom nav bar trên mobile
2. ReplyPanel full screen thay vì side panel
3. Font size và touch target phù hợp (min 44px touch area)
4. Test bằng cách resize browser
Giữ nguyên dark theme và CSS variables.
```

### Prompt 4.4 — Performance & cleanup
```
Optimize performance trước khi deploy production:
1. Chạy npm run build và fix tất cả warnings
2. Thêm SQLite indexes cho các query hay dùng nhất
3. Limit knowledge context khi chat (tránh token overflow)
4. Thêm error boundaries trong React components
5. Cleanup console.log để không leak sensitive data
```

---

## PHASE 3 — Local AI (tương lai)

### Prompt 5.1 — Swap Claude API → Ollama
```
Khi cần chuyển về local LLM:
1. Install Ollama và pull model llama3 hoặc mistral
2. Trong lib/ai.ts, thêm function switchToLocal(model: string)
3. Tạo env var LOCAL_AI=true để toggle giữa Claude API và Ollama
4. Test: draft reply quality có tương đương không?
5. Benchmark tốc độ và chất lượng
```

### Prompt 5.2 — Swap Google STT → Whisper local
```
Thay Google STT bằng Whisper chạy local:
1. Setup Whisper Python server (faster-whisper)
2. Tạo endpoint /api/transcribe local
3. Trong lib/transcribe.ts, thêm fallback: nếu WHISPER_URL có → dùng local, không thì Google STT
4. Test với file tiếng Việt — compare accuracy
```

---

## Lưu ý khi dùng Claude CLI

### Context quan trọng cần nhắc
```
Khi Claude có vẻ không hiểu codebase, thêm vào đầu prompt:
"Đọc CLAUDE.md trước. Project này là IPK (Internal Project Knowledge) cho SolidBytes.
Tech stack: Next.js 14 + SQLite + Anthropic API. Dark theme với CSS variables."
```

### Khi gặp lỗi lạ
```
Claude ơi, tôi đang gặp lỗi này: [paste error]
File liên quan: [tên file]
Hãy:
1. Đọc file đó
2. Tìm nguyên nhân
3. Fix và giải thích tại sao
```

### Khi muốn thêm feature mới
```
Tôi muốn thêm [tên feature].
Trước khi code:
1. Đề xuất cách implement phù hợp với codebase hiện tại
2. List các file cần thay đổi
3. Có impact gì đến features khác không?
Sau khi tôi confirm → mới bắt đầu code.
```

### Khi review code trước khi commit
```
Review toàn bộ thay đổi hiện tại:
1. Có bug tiềm ẩn nào không?
2. Có lộ sensitive data (API key, user data) trong logs không?
3. TypeScript types đầy đủ chưa?
4. Có edge case nào chưa handle không?
```

### Khi deploy
```
Chuẩn bị deploy lên production:
1. Chạy npm run build — fix tất cả errors
2. Check tất cả env vars cần thiết đã có trong .env.local chưa
3. SQLite database path đúng chưa?
4. ffmpeg có trong server không?
5. Test /api/seed để confirm DB migrate đúng
```

---

## Quick commands

```bash
# Chạy dev server
npm run dev

# Type check
npx tsc --noEmit

# Build production
npm run build

# Test webhook locally (thay YOUR_PROJECT_ID)
curl -X POST http://localhost:3000/api/webhook/slack \
  -H "Content-Type: application/json" \
  -d '{"project_id":"YOUR_PROJECT_ID","from_name":"John Kim","channel":"#general","workspace":"neopets.slack.com","message":"@steven can you confirm the deadline?","secret":"your-secret"}'

# Xem DB
npx better-sqlite3 data/brain.db ".tables"
npx better-sqlite3 data/brain.db "SELECT * FROM projects"

# Reset DB (cẩn thận!)
rm data/brain.db && npm run dev
```
