# Testing Strategy — IPK

## Hiện trạng thẳng thắn

Chưa có test framework (không jest/vitest, không CI). Chiến lược hiện tại là **typecheck + script kiểm tra + manual verify checklist**. Đây là trade-off có chủ đích cho giai đoạn move-fast; mục dưới cùng là lộ trình nâng cấp.

## Bắt buộc trước mọi PR

```bash
npx tsc --noEmit     # 1. Typecheck — không lỗi
npm run build        # 2. Build pass
```

Sau đó chạy **manual verify checklist** cho phần bạn đụng vào:

### Checklist core flows

| Flow | Cách verify |
|---|---|
| **Mention → draft** | `curl POST /api/webhook/slack` (payload mẫu trong [development.md](./development.md)) → mention hiện trong Slack Feed → mở ra có draft reply → sửa → Copy & Done → status thành replied |
| **Flag flow** | Flag một mention → login role boss → thấy trong BossDashboard flagged queue → approve/reject |
| **Upload text → knowledge** | Add source dạng text trong SourcesPanel → AI phân loại → knowledge page được tạo/update đúng project |
| **Upload video → meeting** | `npx tsx scripts/test-video.ts` (cần dev server chạy + GEMINI_API_KEY) — hoặc upload file thật qua UI |
| **Chat có citation** | Hỏi 1 câu có trong knowledge → trả lời kèm chip `[Source: ...]` đúng nguồn |
| **Permissions** | Login employee → không thấy nút xoá project, không thấy Users nav |
| **Dark/light** | Toggle theme — không có màu nào "kẹt" lại theme cũ (dấu hiệu hardcode màu) |

### Khi đổi schema DB
- Xoá `data/brain.db` → chạy dev → seed → app hoạt động (đường DB mới).
- Giữ DB cũ → chạy dev → không crash, cột mới có default đúng (đường additive migration). **Phải test cả hai.**

### Khi đổi prompt trong `lib/ai.ts`
1. Chuẩn bị 2–3 input mẫu (mention thật, transcript mẫu).
2. Chạy output với prompt cũ và mới, so sánh cạnh nhau.
3. Kiểm tra edge: output có phải JSON hợp lệ không (các hàm parse có fallback nhưng fallback = mất data), tiếng Việt có tự nhiên không.
4. Ghi vào PR: prompt nào đổi, ví dụ output trước/sau.

## Scripts có sẵn

| Script | Test gì | Điều kiện |
|---|---|---|
| `npx tsx scripts/test-stt.ts` | Transcription config (tạo mp3 câm 2s, gọi `transcribeAudio`) | ffmpeg |
| `npx tsx scripts/test-video.ts` | E2E upload video: tạo project test → upload → verify meeting tồn tại | dev server đang chạy |

(`scripts/test-video.js` là bản compiled trùng lặp của `.ts` — dùng bản `.ts`.)

## Lộ trình nâng cấp (khi có issue tương ứng)

1. **Vitest + unit test cho phần pure**: `buildContext`, `buildCodeContext`, `autoTagMessage`, resolveProjectId — không cần mock gì nhiều.
2. **API integration test**: better-sqlite3 với DB in-memory (`:memory:`), test các route CRUD + webhook auth (đặc biệt case secret sai → 401, secret trống → skip).
3. **GitHub Actions CI**: typecheck + build + test trên mỗi PR.
4. Sau cùng mới đến E2E (Playwright) — chỉ khi core flows ổn định.
