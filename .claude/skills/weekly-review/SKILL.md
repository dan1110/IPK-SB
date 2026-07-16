---
name: weekly-review
description: Weekly project review — đánh giá tiến độ, lên kế hoạch 2 tuần tới, tạo GitHub issues theo convention [X][Y][Z] ABC. Dùng mỗi tuần một lần, hoặc khi cần re-plan giữa chừng.
---

# Weekly Review — IPK

Quy trình review dự án hằng tuần. Kết quả cuối cùng: một bộ GitHub issues cho 2 tuần tới, đã được người dùng duyệt trước khi tạo.

## Bước 1 — Thu thập hiện trạng

Chạy song song:

```bash
git log --oneline --since="2 weeks ago"        # việc đã làm
gh issue list --state open --limit 50          # việc đang mở
gh issue list --state closed --limit 30 --search "closed:>=<2-tuần-trước>"  # việc đã đóng
```

Đọc thêm:
- `docs/README.md` — roadmap/goals hiện tại (nếu có mục tiêu quý)
- Báo cáo tuần trước tại `docs/reports/` (file mới nhất) — so sánh kế hoạch vs thực tế

## Bước 2 — Đánh giá tiến độ

Tổng hợp ngắn gọn:
- **Done**: issues đã đóng + commit đáng kể không gắn issue
- **Slipped**: issues quá 2 tuần chưa động — nêu lý do nếu suy ra được, đề xuất giữ/bỏ/chia nhỏ
- **Risk**: dependency bên ngoài (n8n của Nghị, Gemini quota), technical debt mới phát sinh

## Bước 3 — Draft kế hoạch 2 tuần

Đề xuất danh sách issues mới. **Mỗi issue phải theo đúng convention title:**

```
[X][Y][Z] Tên issue
```

- **[X]** — mã số issue tăng dần của dự án (1, 2, 3...). Lấy số lớn nhất trong title của các issue hiện có (kể cả closed) rồi +1. KHÔNG dùng số GitHub tự sinh.
- **[Y]** — vai trò: `BE` | `FE` | `FS` (full-stack) | `AI` (prompt/model) | `OPS` | `DOCS`
- **[Z]** — loại: `Feature` | `Bug` | `Chore`

Ví dụ: `[12][FE][Feature] Trang Client Brief tự động`

Body của mỗi issue theo template:

```markdown
## Context
Vì sao cần làm, liên quan flow nào.

## Acceptance criteria
- [ ] tiêu chí đo được 1
- [ ] tiêu chí đo được 2

## Gợi ý kỹ thuật
File/module liên quan (vd: lib/db.ts, components/ReplyPanel.tsx).

## Design (chỉ issue FE)
Hướng design: <"theo pattern của component X" | "Stitch — chạy /stitch-design" | link mockup | "không cần mockup">
```

**Quy tắc FE**: mọi issue `[FE]` có UI mới phải điền mục Design với hướng tiếp cận + bắt buộc bám design system. Có design tham chiếu trước (Stitch, pattern có sẵn, hoặc mockup) là **khuyến khích, không bắt buộc** — chọn cách phù hợp với issue. Stitch chỉ là một tùy chọn (skill `stitch-design`), không phải cổng bắt buộc.

Gán label khi tạo: `role:<Y>` và `type:<Z>` (tạo label nếu chưa có: `gh label create`).

## Bước 4 — Duyệt trước khi tạo (bắt buộc)

Trình bày cho người dùng: bảng tiến độ + danh sách issue đề xuất (title, 1 dòng mô tả, ước lượng). **CHỜ người dùng xác nhận** — có thể sửa/bỏ/thêm. Tuyệt đối không `gh issue create` trước khi được duyệt (nguyên tắc human-in-the-loop của dự án).

## Bước 5 — Tạo issues + lưu báo cáo

Sau khi duyệt:

```bash
gh issue create --title "[X][Y][Z] ..." --body "..." --label "role:Y,type:Z"
```

Lưu báo cáo vào `docs/reports/YYYY-MM-DD-weekly.md`: tiến độ tuần qua, danh sách issue đã tạo (kèm số GitHub), rủi ro. Commit file báo cáo.
