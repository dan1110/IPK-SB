---
name: new-issue
description: Tạo nhanh 1 GitHub issue đúng convention [X][Y][Z] ABC của IPK — tự tính mã số X, gán label, áp template body. Dùng khi phát hiện bug/việc mới ngoài chu kỳ weekly review.
---

# New Issue — IPK

Tạo 1 issue lẻ đúng convention, ngoài chu kỳ weekly review.

## Convention title

```
[X][Y][Z] Tên issue
```

- **[X]** — mã số tăng dần của dự án. Tính bằng cách: `gh issue list --state all --limit 100 --json title`, parse số trong `[X]` đầu tiên của mỗi title, lấy max + 1.
- **[Y]** — `BE` | `FE` | `FS` | `AI` | `OPS` | `DOCS`
- **[Z]** — `Feature` | `Bug` | `Chore`

## Body template

```markdown
## Context
...

## Acceptance criteria
- [ ] ...

## Gợi ý kỹ thuật
...

## Design (chỉ issue FE)
Hướng design: <"theo pattern của X" | "Stitch — /stitch-design" | link mockup | "không cần mockup">
```

## Các bước

1. Hỏi/suy ra từ context: nội dung issue, vai trò Y, loại Z. Bug thì thêm mục **Steps to reproduce** vào body.
2. Tính X như trên.
3. Issue `[FE]` có UI mới → điền mục Design (bắt buộc bám design system; có mockup/Stitch trước là khuyến khích, không bắt buộc — Stitch chỉ là tùy chọn, xem skill `stitch-design`).
4. Trình title + body cho người dùng xác nhận, rồi:

```bash
gh issue create --title "..." --body "..." --label "role:Y,type:Z"
```

Label chưa tồn tại → `gh label create role:Y --color <màu>` trước.
