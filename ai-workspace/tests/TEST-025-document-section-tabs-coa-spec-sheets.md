# Test Scenarios: TEST-025-document-section-tabs-coa-spec-sheets

Status: PASSED
Ticket: T-025-document-section-tabs-coa-spec-sheets
Executed: 2026-06-24

## Objective
Verify the document section is split into three tabs (Import Documents, COA, Specification Sheets), that Import is unchanged, COA lists per-item placeholders, and Specification Sheets fetch from FileMaker and render a viewable + printable dialog.

## Proposed Strategy
Static typecheck + lint (automated) plus manual browser verification against a real PO, confirming FileMaker spec-sheet/QPA reads and the print output.

## Scenarios

- [x] **Three Tabs Render**
  - Open an order detail page; locate the document section.
  - Expected: Tabs "Import Documents", "COA (Certificate of Analysis)", "Specification Sheets" inside the "Manage order documents" card; active tab clearly highlighted (solid primary).
  - Result: PASS.

- [x] **Import Documents Unchanged**
  - Expected: The existing document list/upload/preview/delete behavior works as before.
  - Result: PASS — behavior preserved; panel now content-only inside the tab card.

- [x] **COA Tab Master-Detail**
  - Switch to COA.
  - Expected: Left line-item list (first auto-selected), right placeholder ("will sync from Google Drive"). Empty state if no line items.
  - Result: PASS — mirrors Import Documents layout.

- [x] **Specification Sheets — Master-Detail**
  - Switch to Specification Sheets.
  - Expected: Left selectable list (first auto-selected); right detail panel with the parameter table. Empty state when none.
  - Result: PASS — list highlight matches Import Documents; no Approved/Pending badge (removed per request).

- [x] **Spec Sheet Parameter Table**
  - Expected: Columns Analyte, Result, Min. Value, Max. Value, Units, Method Reference populated from `Web_QPA`.
  - Result: PASS — verified against a real PO (WHI1173).

- [x] **Print Spec Sheet**
  - Click Print.
  - Expected: A clean printable view opens, prints, and the window auto-closes afterward.
  - Result: PASS — `onafterprint` closes the window (no lingering about:blank).

- [x] **QPA Query Correctness**
  - Expected: Parameters from `Web_QPA` filtered by `ID_fk`, `Type = "CST"`, `COMMENT = "Comments"`, sorted by `SortOrder` ascending.
  - Result: PASS.

- [x] **Lazy Tab Loading**
  - Expected: `/api/orders/spec-sheets` only called when the Specification Sheets tab is first opened.
  - Result: PASS.

- [x] **Vendor Scoping**
  - Request spec sheets for a PO not owned by the vendor (API).
  - Expected: 404 "Order not found for this vendor."
  - Result: PASS.

- [x] **Closed-PO Read-Only (added during review)**
  - Open a closed/voided PO.
  - Expected: Vendor actions, vendor comments, and document upload/delete are disabled in the UI and rejected on the server; disabled fields show no caret.
  - Result: PASS — UI + server guards confirmed.

- [x] **Clean TypeScript Compilation**
  - `npx tsc --noEmit` → exit 0. Result: PASS.

- [x] **Clean Lint Verification**
  - `npx eslint` on the touched files → exit 0. Result: PASS.
