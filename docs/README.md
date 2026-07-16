# IPK Docs — Wiki nội bộ

Đây là entry point cho mọi tài liệu của dự án IPK (Internal Project Knowledge). **Member mới: đọc theo thứ tự từ trên xuống.**

## Bắt đầu ở đâu

| Tài liệu | Đọc khi nào |
|---|---|
| [business.md](./business.md) | Đầu tiên — hiểu bài toán shadow, vì sao IPK tồn tại |
| [glossary.md](./glossary.md) | Song song với business — thuật ngữ dùng trong team |
| [architecture.md](./architecture.md) | Trước khi đọc code — kiến trúc, data flow |
| [development.md](./development.md) | Trước khi code — setup, workflow, issue convention |
| [coding-standard.md](./coding-standard.md) | Trước khi mở PR — conventions bắt buộc |
| [api.md](./api.md) | Khi làm việc với API routes |
| [testing.md](./testing.md) | Khi cần verify thay đổi |
| [deployment.md](./deployment.md) | Khi release |
| [troubleshooting.md](./troubleshooting.md) | Khi gặp lỗi đã có người gặp trước |

## Quy trình làm việc của team (tóm tắt)

1. **Weekly review** (mỗi tuần, chạy skill `/weekly-review` trong Claude Code): đánh giá tiến độ → lên kế hoạch 2 tuần → tạo GitHub issues theo convention `[X][Y][Z] Tên issue`. Báo cáo lưu tại [reports/](./reports/).
2. **Nhận issue** → đọc Context + Acceptance criteria trong issue.
3. **Issue FE có UI mới** → bám design system ([coding-standard.md](./coding-standard.md)). Có design tham chiếu trước (Stitch, pattern có sẵn, hoặc mockup) là khuyến khích, không bắt buộc.
4. **Code** theo [coding-standard.md](./coding-standard.md) → verify theo [testing.md](./testing.md) → PR.
5. **Phát hiện việc mới giữa chừng** → tạo issue lẻ bằng skill `/new-issue`, đừng làm chen ngang không có issue.

## Claude Code skills của dự án

| Skill | Dùng để |
|---|---|
| `/weekly-review` | Review tuần + tạo issues 2 tuần tới |
| `/new-issue` | Tạo 1 issue lẻ đúng convention |
| `/work-issue <N>` | Luồng chuẩn xử lý 1 issue: plan → implement → test → branch → PR → resolve |
| `/stitch-design` | (Tùy chọn) Dựng UI mới qua Stitch MCP khi cần design tham chiếu |

## Nguyên tắc cập nhật docs

- Docs sai còn tệ hơn không có docs — sửa code làm đổi hành vi thì **sửa docs trong cùng PR**.
- Gặp lỗi mất >30 phút để giải → thêm vào [troubleshooting.md](./troubleshooting.md).
- Thuật ngữ mới xuất hiện trong team → thêm vào [glossary.md](./glossary.md).
