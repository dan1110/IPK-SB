# Business Domain — IPK

## Bài toán

SolidBytes (SB) làm outsourcing/consulting cho nhiều client. Mô hình đặc thù: **nhân viên SB làm việc "shadow" dưới danh nghĩa sếp (Steven Cao)** trên Slack workspace của từng client. Client tin rằng họ đang nói chuyện trực tiếp với Steven.

Hệ quả:
- Một nhân viên có thể phụ trách nhiều client, và một client có thể được nhiều nhân viên luân phiên phụ trách.
- Nhân viên phải **nắm context của client rất nhanh**: lịch sử trao đổi, cam kết đã hứa, thuật ngữ nội bộ của client, tình trạng dự án.
- Mọi phát ngôn dưới tên Steven phải **nhất quán về giọng văn và thông tin** — mâu thuẫn là mất niềm tin của client.

## IPK giải quyết gì

IPK (Internal Project Knowledge) là "bộ não" tập trung theo từng project/client:

1. **Slack Feed** — n8n theo dõi @mention của Steven trong các Slack workspace của client, đẩy về IPK qua webhook. Nhân viên thấy tất cả mention ở một nơi, khỏi phải đảo qua từng workspace.
2. **Draft reply** — AI (Gemini) đọc mention + toàn bộ knowledge của project, draft câu trả lời. Nhân viên sửa, copy, tự dán vào Slack.
3. **Knowledge & Meetings** — nơi lưu meeting notes (upload video/audio → transcribe → AI tóm tắt), tài liệu, knowledge pages theo từng project. Đây là nguồn context cho AI draft.
4. **Chat** — hỏi đáp với AI trên knowledge của project, có trích dẫn nguồn.

## Nguyên tắc bất di bất dịch

1. **Human-in-the-loop**: AI KHÔNG BAO GIỜ tự gửi gì cho client. Mọi output của AI (draft reply, tóm tắt) đều phải qua người duyệt/copy thủ công. Đây là ranh giới an toàn số 1 — vi phạm là rủi ro trực tiếp với client.
2. **Flag sếp**: mention nhạy cảm (giá cả, cam kết pháp lý, tình huống căng thẳng) → nhân viên flag để Steven trả lời trực tiếp, không dùng draft.
3. **Mỗi project là một silo**: knowledge của client A không được lẫn vào context draft cho client B.

## Người dùng

| Vai trò | Dùng IPK để |
|---|---|
| Nhân viên SB (shadow) | Xem mention, đọc context, dùng draft, ghi meeting notes |
| Steven (sếp) | Xử lý mention bị flag, giám sát chất lượng reply |

## Vòng đời một mention

```
Client @mention Steven trên Slack
  → n8n bắt event → POST /api/webhook/slack (IPK)
  → hiện trong Slack Feed (status: pending)
  → nhân viên mở → AI draft reply từ knowledge của project
  → nhân viên sửa draft → Copy & Done (status: done)
     hoặc → Flag sếp (status: flagged) → Steven tự trả lời
```

## Thuật ngữ

Xem [glossary.md](./glossary.md).
