# Ticket: T-025-document-section-tabs-coa-spec-sheets

Status: COMPLETED
Created: 2026-06-24
Completed: 2026-06-24
Author: AI Agent

## Problem Statement
The Order Details document section currently shows every document type in a single flat list ("Manage order documents"). The business needs it split into three distinct tabs, matching the legacy portal:

1. **Import Documents** — the existing order document list (upload/preview/delete).
2. **COA (Certificate of Analysis)** — an individual COA per line item.
3. **Specification Sheets** — per-line-item spec sheets fetched directly from FileMaker, including their quality parameters.

## Goal
Convert the document section into a tabbed container with the three tabs above:
- **Import Documents**: unchanged behavior — the current document panel.
- **COA**: a per-line-item list with an individual COA slot for each item. The COA files are not on Google Drive yet, so build the per-item list/structure with an empty ("not available yet") state, ready to wire to Drive later.
- **Specification Sheets**: a per-line-item list fetched from FileMaker showing each item's spec sheet (name + approval status) and its quality parameters.

## Specification Sheets — FileMaker fetch (per the provided steps)
**Step 1 — Get the Customer Standard ID (per line item)**
- Layout: `Web_MLI` (PO line items — already used by the app).
- Related fields per line item:
  - `MLI_CSTD__ContactId_ItemNo::ID` → spec sheet ID (foreign key for Step 2).
  - `MLI_CSTD__ContactId_ItemNo::USSMID_Item` → spec sheet label/name.
  - `MLI_CSTD__ContactId_ItemNo::Approved` → approval flag (1 = Approved, 0 = Pending).

**Step 2 — Fetch the Quality Parameters (QPA)**
- Layout: `Web_QPA` (add to the FileMaker config — not currently present).
- Find criteria: `ID_fk = <ID from Step 1>`, `Type = "CST"`, `COMMENT = "Comments"`.
- Sort: `SortOrder` ascending.
- Returned analyte fields: `ParameterName`, `ParameterValue`, `MinValue`, `MaxValue`, `Unit`, `MethodReference`.

## Scope
1. Add `Web_QPA` to `config/filemaker.ts`.
2. Backend: add a service to build the per-item spec-sheet list (line items with the CSTD fields) and, for each item that has a spec sheet ID, fetch its QPA parameters. Expose via a new API route.
3. Frontend: introduce a tabbed document container with the three tabs.
   - Import Documents tab → the existing document panel.
   - COA tab → per-line-item list with an empty COA slot per item (placeholder for future Drive sync).
   - Specification Sheets tab → per-line-item list showing the spec sheet name + approval status. Selecting an item opens a **"Specification Sheet" dialog** that displays the quality parameters in a table and lets the user **view and print** it.
4. The Specification Sheet dialog table uses these columns (mapped from `Web_QPA`): **Analyte** (`ParameterName`), **Result** (`ParameterValue`), **Min. Value** (`MinValue`), **Max. Value** (`MaxValue`), **Units** (`Unit`), **Method Reference** (`MethodReference`). The dialog has **Print** and **Close** actions.
5. Wire the tabbed container into the Order Details page in place of the current single panel.

## Out of Scope
- Uploading/syncing/storing COA files to Google Drive (structure only; data wiring is a later ticket).
- Any change to the existing Import Documents upload/preview/delete behavior.
- Writing back spec sheet / QPA data to FileMaker (read-only here).
- Auth, environment, or `package.json` dependency changes.

## Acceptance Criteria
- [x] The document section shows three tabs: Import Documents, COA (Certificate of Analysis), Specification Sheets, matching the existing card theme (tabs placed inside the "Manage order documents" card with a clear active highlight).
- [x] Import Documents tab preserves the current document list and all its behavior.
- [x] COA tab lists each PO line item (master-detail) with an empty "not available yet" COA state (placeholder for future Drive sync).
- [x] Specification Sheets tab lists each line item that has a spec sheet (master-detail; approval badge removed per developer request).
- [x] Selecting a spec sheet shows the quality parameters in a table (Analyte, Result, Min. Value, Max. Value, Units, Method Reference) fetched from `Web_QPA` in a right-side detail panel.
- [x] A Print action prints the spec sheet (printable window auto-closes afterward).
- [x] `Web_QPA` is added to `config/filemaker.ts`.
- [x] Loading and empty states are handled (e.g. no spec sheet for an item, no parameters).
- [x] Touched files pass TypeScript compilation and lint verification.

## Notes
- The Approved/Pending badge was removed per developer feedback (specs only).
- Added during review: whole-order read-only when status is closed/voided (vendor actions, comments, document upload/delete) — enforced UI + server.
