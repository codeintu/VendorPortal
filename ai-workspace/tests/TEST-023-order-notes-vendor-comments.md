# Test Scenarios: TEST-023-order-notes-vendor-comments

Status: PASSED
Ticket: T-023-order-notes-vendor-comments
Executed: 2026-06-23

## Objective
Verify the PO Notes (read-only) and Vendor Comments (read + append) panels render above Line Items on the Order Details screen, match the existing theme, and that posting a comment persists to FileMaker with author name + timestamp and reflects on the page without a full reload.

## Proposed Strategy
Static typecheck + lint for the touched files (automated), plus manual browser verification of layout and the post-comment round-trip against a real PO.

## Scenarios

- [x] **Panels Render Above Line Items**
  - Open an order detail page (`/dashboard/orders/<poNumber>`).
  - Expected: A two-panel block appears between the summary cards and the Line Items table — "PO Notes" on the left, "Vendor Comments" on the right.
  - Result: PASS — verified in browser; block renders above Line Items.

- [x] **PO Notes Content (read-only)**
  - Use a PO that has a `Message` value in FileMaker.
  - Expected: The PO Notes panel shows the `Message` text with line breaks preserved and no input controls. A PO with no message shows the empty-state placeholder.
  - Result: PASS — multi-line `Message` renders with original line structure (carriage returns normalized for display); read-only confirmed.

- [x] **Existing Vendor Comments Render**
  - Use a PO that already has `VendorNotes` content.
  - Expected: Existing comments display in the right panel, preserving the `{comment}` / ` - {Author} {timestamp}` line format; long histories scroll within the panel.
  - Result: PASS — existing comments render with author/timestamp lines; long content scrolls inside the fixed-height box.

- [x] **Post a New Comment**
  - Type a comment and click Post (or press Enter).
  - Expected: The new comment appears at the bottom of the Vendor Comments panel without a full page reload, the input clears, and the entry shows the vendor's name (PersonFirstName + PersonLastName) and a timestamp in `M/D/YYYY h:mm:ss AM/PM` format.
  - Result: PASS — comment appended live with name + timestamp (e.g. "6/23/2026 6:57:58 PM"); input clears.

- [x] **Persistence to FileMaker**
  - After posting, reload the page (or re-open the order).
  - Expected: The posted comment is still present, confirming it was written to `Web_PO.VendorNotes`.
  - Result: PASS — posted comments persist on reload (written to `Web_PO.VendorNotes`).

- [x] **Empty Comment Rejected**
  - Attempt to post an empty/whitespace-only comment.
  - Expected: The Post button is disabled / the request is rejected (400); no entry is added.
  - Result: PASS — Post disabled for empty/whitespace input; server also rejects with 400.

- [x] **Post Failure Handling**
  - Simulate a failed post (e.g. invalid PO / server error).
  - Expected: An inline error message is shown and the typed text is preserved (not cleared).
  - Result: PASS — error path shows inline message and retains the typed text.

- [x] **Responsive Layout & Theme**
  - View on desktop and narrow/mobile widths in both light and dark mode.
  - Expected: Panels sit side by side on desktop, stack on mobile, and match the existing card styling (border, radius, shadow, primary accents).
  - Result: PASS — side by side on desktop, stacked on mobile; fixed-height panels match card theme in light/dark.

- [x] **Clean TypeScript Compilation**
  - Run `npx tsc --noEmit`.
  - Expected: Exit 0, no errors.
  - Result: PASS — exit 0.

- [x] **Clean Lint Verification**
  - Run `npx eslint` on the four touched files.
  - Expected: Exit 0, no warnings or errors.
  - Result: PASS — exit 0, clean.

## Additional Verification (post-review fixes)
- [x] **Fixed-height panels scroll internally** — content overflow scrolls inside each `h-[460px]` box; cards do not grow. PASS.
- [x] **Visible input caret** — text cursor blinks in the comment box and order search field after the `caret-color` fix. PASS.
