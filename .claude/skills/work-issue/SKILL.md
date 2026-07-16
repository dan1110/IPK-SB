---
name: work-issue
description: Luồng chuẩn để developer xử lý một GitHub issue của IPK từ đầu đến khi merge — lấy issue, lập plan, xử lý block, implement, test local, tạo branch + PR, resolve issue. Dùng khi bắt đầu làm một issue. Truyền số issue làm arg (vd /work-issue 3).
---

# Work Issue — Luồng xử lý issue cho developer (IPK)

Luồng cố định cho mọi issue. Nếu người dùng truyền số issue (vd `/work-issue 3`) thì làm việc trên issue đó; không có thì hỏi hoặc `gh issue list` để chọn.

Nguyên tắc chung: **các hành động outward-facing (push, tạo PR, đóng issue) phải hỏi người dùng xác nhận trước khi làm** — đúng tinh thần human-in-the-loop của dự án.

---

## 1. Lấy issue

```bash
gh issue view <N> --json number,title,body,labels,state,comments
```

- Đọc kỹ **Context** + **Acceptance criteria** + **Gợi ý kỹ thuật**.
- Parse title `[X][Y][Z] Tên` → biết vai trò (Y) và loại (Z).
- Gán mình vào issue + đổi trạng thái sang đang làm:

```bash
gh issue edit <N> --add-assignee @me --add-label "status:in-progress"
```

## 2. Tạo plan implement (nếu chưa có)

- Nếu issue chưa có plan rõ trong body/comment → phác plan ngắn: các file sẽ đụng, thứ tự làm, cách verify (map thẳng vào Acceptance criteria).
- Với task lớn/nhiều bước, dùng agent `Plan` để dựng plan chi tiết.
- Comment plan vào issue để cả team thấy hướng đi:

```bash
gh issue comment <N> --body "## Plan\n- Bước 1 ...\n- Bước 2 ..."
```

- Issue `[FE]` có UI mới: chốt hướng design (bám pattern có sẵn / Stitch `/stitch-design` / mockup). Bám design system là bắt buộc; Stitch là tùy chọn. Xem `docs/coding-standard.md`.

## 3. Xử lý block (nếu có)

Nếu gặp block không tự xử lý được (thiếu thông tin, chờ người khác, dependency ngoài như n8n của Nghị / Gemini quota):

```bash
gh issue comment <N> --body "🚧 **Blocked**: <mô tả block cụ thể + cần gì để gỡ>"
gh issue edit <N> --remove-label "status:in-progress" --add-label "status:blocked"
```

→ Dừng lại, báo người dùng. Không im lặng bỏ dở. Khi gỡ được block thì đổi lại `status:in-progress` và tiếp tục.

## 4. Tiến hành implement

- Code theo `docs/coding-standard.md`: query qua `db.*` (không raw SQL), route mới thêm `force-dynamic` + error `{ error }`, UI dùng CSS variables (không hardcode màu), fallback khi thiếu `GEMINI_API_KEY`.
- Bám sát Acceptance criteria — không mở rộng phạm vi ngoài issue (việc mới phát sinh → `/new-issue`).

## 5. Kiểm tra code (test local trước)

Chạy tại local, **phải xanh trước khi push**:

```bash
npm run typecheck        # tsc --noEmit
npm run build            # next build
npm test                 # nếu dự án đã có test (issue #5 trở đi)
```

Rồi chạy **manual verify checklist** cho phần đụng vào (`docs/testing.md`): flow mention→draft, upload→knowledge, chat citation, permissions, dark/light... Đổi schema DB → test cả DB mới lẫn DB cũ. Đổi prompt `lib/ai.ts` → so output trước/sau.

## 6. Checkout nhánh tính năng

Đặt tên theo convention: `<type>/<X>-<mô-tả-ngắn>` (type = feature/fix/chore/refactor/docs, X = mã issue).

```bash
git checkout -b feature/<X>-<mo-ta-ngan>     # vd: feature/8-client-brief
```

> Lưu ý an toàn: nếu đã lỡ implement trên `main`, tạo branch bằng lệnh trên **trước khi commit** — thay đổi trong working tree sẽ theo sang branch mới, `main` không bị commit bẩn. Muốn gọn hơn thì tách branch ngay từ bước 4.

```bash
git add -A
git commit -m "<type>: <mô tả> (#<N>)"       # Conventional Commits
```

## 7. Push code và tạo PR

**Hỏi người dùng xác nhận trước khi push + tạo PR** (đây là hành động outward-facing).

```bash
git push -u origin feature/<X>-<mo-ta-ngan>
gh pr create \
  --title "<type>: <mô tả> (#<N>)" \
  --body "Closes #<N>\n\n## Thay đổi\n...\n## Test\n- [x] typecheck/build pass\n- [x] verify checklist: ...\n\n## Lưu ý\n- Đổi schema? Đổi prompt AI? Cần deploy env gì?" \
  --label "status:in-review"
```

- Body **bắt buộc có `Closes #<N>`** để PR merge sẽ tự đóng issue.
- Đổi UI → đính screenshot. Đổi schema/prompt/env → ghi rõ trong PR (đặc biệt các issue cần deploy coordination như đổi env var).
- Cập nhật `docs/` trong cùng PR nếu thay đổi làm đổi hành vi.
- Đổi label issue: `gh issue edit <N> --remove-label "status:in-progress" --add-label "status:in-review"`.

## 8. Resolve issue sau khi PR merge

- PR có `Closes #<N>` → merge xong GitHub **tự đóng issue**. Kiểm tra:

```bash
gh pr view <PR> --json state,mergedAt
gh issue view <N> --json state          # mong đợi: CLOSED
```

- Nếu chưa tự đóng (PR không có `Closes`): `gh issue close <N> --comment "Done in #<PR>"`.
- Dọn label: bỏ `status:in-review`, thêm `status:done` nếu còn mở; xoá branch đã merge (`git push origin --delete <branch>` hoặc để GitHub auto-delete).

---

## Tóm tắt trạng thái issue theo bước

| Bước | Label |
|---|---|
| 1–2 bắt đầu | `status:in-progress` |
| 3 gặp block | `status:blocked` |
| 7 mở PR | `status:in-review` |
| 8 merge xong | đóng issue (+ `status:done` nếu cần) |
