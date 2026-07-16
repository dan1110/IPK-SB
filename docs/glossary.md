# Glossary — Thuật ngữ IPK

| Thuật ngữ | Nghĩa |
|---|---|
| **IPK** | Internal Project Knowledge — tên hệ thống này. Codebase còn tên cũ `project-brain` trong package.json. |
| **Shadow** | Mô hình nhân viên SB làm việc dưới danh nghĩa Steven Cao trên Slack của client. Client không biết người thật đang trả lời. |
| **Sếp / Steven** | Steven Cao — danh nghĩa duy nhất giao tiếp với client. |
| **Client workspace** | Slack workspace riêng của từng client mà SB được mời vào. |
| **Mention** | Một lần client @mention Steven trên Slack, được n8n đẩy về IPK. Đơn vị công việc chính của Slack Feed. |
| **Slack Feed** | Màn hình danh sách mention chờ xử lý (component `SlackFeed.tsx`). |
| **Draft reply** | Câu trả lời do AI soạn từ knowledge của project. Chỉ là draft — người phải sửa và tự gửi. |
| **Copy & Done** | Hành động nhân viên copy draft (đã sửa) để dán vào Slack, đánh dấu mention là xử lý xong. |
| **Flag sếp** | Đánh dấu mention cần Steven trả lời trực tiếp (nhạy cảm: giá, pháp lý, cam kết). |
| **Knowledge page** | Trang tài liệu thuộc một project — nguồn context cho AI. |
| **Source** | Tên gọi chung cho knowledge page + meeting note trong UI (SourcesPanel). |
| **Meeting note** | Ghi chú họp — nhập tay hoặc upload video/audio để AI transcribe + tóm tắt. |
| **Project** | Một client/dự án — silo knowledge riêng, không lẫn giữa các project. |
| **n8n** | Công cụ automation (self-host tại `auto-n8n.solidbytes.vn`, do Nghị quản) bắt Slack event và gọi webhook của IPK. |
| **Webhook "zapier"** | Tên legacy từ thời dùng Zapier — giờ chỉ còn ở env var `ZAPIER_WEBHOOK_SECRET`. Endpoint thực tế nhận từ n8n là `/api/webhook/slack` (+ `slack-knowledge`, `jira`, `github`). Đừng đổi tên env var (n8n đang dùng). |
| **Human-in-the-loop** | Nguyên tắc: AI không tự gửi gì cho client, mọi action cần người approve. |
| **Stitch** | Công cụ design (Google Stitch, dùng qua MCP). Là **tùy chọn** để dựng UI mới — không bắt buộc. Xem skill `stitch-design`. |
| **Convention `[X][Y][Z]`** | Format title GitHub issue: `[mã số][vai trò][loại] Tên`. Xem [development.md](./development.md). |
