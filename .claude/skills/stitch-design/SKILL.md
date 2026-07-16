---
name: stitch-design
description: (Tùy chọn) Dựng trang/màn hình mới bằng Stitch MCP khi cần design tham chiếu trước khi code FE. Dùng khi muốn dựng nhanh một trang mới hoàn chỉnh; đảm bảo design tuân theo design system của IPK. Không bắt buộc — có thể thay bằng bám pattern có sẵn hoặc mockup.
---

# Stitch Design Workflow — IPK

Stitch là **một tùy chọn** để dựng UI mới khi cần design tham chiếu — không phải cổng bắt buộc. Có thể thay bằng bám pattern component có sẵn hoặc mockup. Khi bạn chọn dùng Stitch, skill này chuẩn hoá quy trình cho nhất quán với design system.

## Bước 0 — Load tool

Stitch MCP tools cần load qua ToolSearch trước:

```
ToolSearch: "select:mcp__stitch__list_projects,mcp__stitch__create_project,mcp__stitch__list_screens,mcp__stitch__get_screen,mcp__stitch__generate_screen_from_text,mcp__stitch__list_design_systems,mcp__stitch__create_design_system_from_design_md,mcp__stitch__apply_design_system,mcp__stitch__edit_screens"
```

## Bước 1 — Tìm project & design system

1. `list_projects` → tìm project **IPK** (hoặc tên chứa "IPK"/"SolidBytes"). Chưa có → `create_project` tên `IPK-SB`.
2. `list_design_systems` → tìm design system của IPK. Chưa có → tạo từ file design của repo:
   - Nguồn: `design-system/MASTER.md` + `design-system/tokens.css`
   - Dùng `create_design_system_from_design_md` (upload MASTER.md, bổ sung tokens quan trọng: dark theme, `--bg0..--bg4`, `--tx0..--tx2`, accent colors)

## Bước 2 — Kiểm tra screen đã tồn tại chưa

`list_screens` trong project IPK. So tên screen với trang đang cần:
- **Đã có** → `get_screen` lấy design, đây là source of truth — code FE phải khớp layout/spacing/màu của screen này. Xong, bỏ qua bước 3.
- **Chưa có** → bước 3.

## Bước 3 — Generate screen mới

1. Viết prompt cho `generate_screen_from_text` từ: mô tả trong GitHub issue + context nghiệp vụ (đọc `docs/business.md`) + design system IPK.
2. Luôn `apply_design_system` với design system IPK.
3. Xem kết quả, `edit_screens` chỉnh nếu lệch (tối đa 2–3 vòng, đừng cầu toàn — chi tiết nhỏ chỉnh lúc code).
4. **Trình screen cho người dùng duyệt trước khi code.**

## Bước 4 — Gắn vào issue & code

1. Comment link screen Stitch vào GitHub issue (`gh issue comment`), điền mục **Design** trong body issue.
2. Khi code: dùng CSS variables trong `app/globals.css` (KHÔNG hardcode màu), component đặt trong `components/`, style theo `design-system/MASTER.md`.
3. Sau khi code xong: mở app bằng browser preview, so side-by-side với screen Stitch.

## Quy tắc (khi đã chọn dùng Stitch)

- Nếu issue này đi theo hướng Stitch: nên có screen được duyệt trước khi code cho gọn (không bắt buộc toàn dự án — chỉ áp khi bạn chọn Stitch cho issue đó).
- Screen Stitch là nguồn sự thật về layout; `app/globals.css` là nguồn sự thật về màu/spacing khi hai bên lệch nhau.
- Không dùng Stitch cũng được — miễn UI mới bám design system (`design-system/MASTER.md` + CSS variables). Xem `docs/coding-standard.md`.
