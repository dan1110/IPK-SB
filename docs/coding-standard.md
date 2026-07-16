# Coding Standard — IPK

Nguồn chi tiết đầy đủ về design: `design-system/MASTER.md`. File này là bản rút gọn bắt buộc + convention code.

## TypeScript / cấu trúc

1. **Mọi query SQLite đi qua `db.*` trong `lib/db.ts`** — không viết raw SQL trong route/component. Thêm query mới = thêm prepared statement vào namespace tương ứng.
2. **Thêm cột/bảng mới**: sửa `CREATE TABLE IF NOT EXISTS` (cho DB mới) VÀ thêm additive migration ở phase 2 (`pragma table_info` + `ALTER TABLE ADD COLUMN`, cho DB đang chạy). Thiếu 1 trong 2 là hỏng một nhóm user.
3. **Types vào `lib/types.ts`** — field JSON-trong-TEXT (tags, action_items...) type là `string`, kèm comment.
4. **API route**: `force-dynamic`, error `{ error: string }`, status code đúng, graceful khi thiếu `GEMINI_API_KEY`. Chi tiết trong [api.md](./api.md).
5. **Prompt AI ở `lib/ai.ts`** — sửa prompt phải test trước/sau với sample data (xem [testing.md](./testing.md)); output JSON luôn có fallback khi parse fail.

## UI / Design system

1. **Không hardcode màu/px** — dùng CSS variables. Token chuẩn là `--color-*` (trong `app/globals.css`); alias legacy (`--bg0..4`, `--tx0..2`, `--brand`...) vẫn hoạt động nhưng **code mới dùng `--color-*`**.
2. **Dark mode**: app dùng class `.dark` trên `<html>` (toggle ở TopBar, lưu localStorage). Mọi màu phải hoạt động ở cả 2 theme — tức là chỉ cần dùng đúng CSS var.
3. **Ưu tiên Tailwind classes** (đã map sẵn về CSS vars trong `tailwind.config.js`) thay vì inline `style={}`. Codebase cũ còn nhiều inline style — không cần refactor ồ ạt, nhưng code mới đừng thêm.
4. **Icons**: Lucide React, size 16/20/24, `currentColor`.
5. **Font**: Inter (400/500/600), JetBrains Mono cho code/ID/timestamp. Không thêm weight thứ 4.
6. **Motion**: Framer Motion, entrance-only, <250ms. Animation thấy >10 lần/session thì bỏ.
7. **Cấm** (anti-patterns từ MASTER.md): gradient tím-hồng kiểu "AI", emoji làm icon, radius >12px trên card, shadow trang trí, phân biệt trạng thái chỉ bằng màu, `onMouseEnter/Leave` để làm hover (dùng CSS `:hover`).
8. **UI mới**: bám design system là bắt buộc; có design tham chiếu trước (Stitch qua `/stitch-design`, hoặc theo pattern trang có sẵn, hoặc mockup) là **khuyến khích, không bắt buộc**. Nếu dùng Stitch: screen quyết định layout, `globals.css` quyết định màu khi hai bên lệch. Nếu không: tái dùng pattern/token của component đang có.

## Nghiệp vụ (không thoả hiệp)

1. **Human-in-the-loop**: không viết code để AI tự gửi bất cứ gì cho client. Draft luôn dừng ở bước người copy/approve.
2. **Silo project**: context AI của project nào chỉ build từ data của project đó — không cross-project.
3. **Webhook**: giữ nguyên tên endpoint và env `ZAPIER_WEBHOOK_SECRET` (n8n production đang trỏ vào).

## Git

- **Commit**: Conventional Commits — `feat:` `fix:` `chore:` `refactor:` `docs:`, scope optional (`fix(api): ...`), imperative, lowercase.
- **Branch**: `<type>/<X>-<mô-tả>` theo mã issue, vd `feature/12-client-brief`.
- **PR**: link issue (`Closes #n`), có screenshot nếu đổi UI, ghi rõ nếu đổi schema DB hoặc prompt AI.
- Docs đổi cùng PR với code làm đổi hành vi.
