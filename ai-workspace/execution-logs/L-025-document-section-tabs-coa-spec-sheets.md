# Execution Log: L-025-document-section-tabs-coa-spec-sheets

Status: COMPLETE
Ticket: T-025-document-section-tabs-coa-spec-sheets
Date: 2026-06-24

## Summary
Split the Order Details document section into three tabs — Import Documents (existing panel), COA (per-item placeholder list), and Specification Sheets (per-item list fetched from FileMaker, with a viewable + printable Specification Sheet dialog).

## Steps Performed
1. **Config** — added `Web_QPA` to the FileMaker layout map.
2. **Backend** — added spec-sheet types and the two-step fetch (line items + CSTD fields → QPA parameters); added a new read-only API route.
3. **Frontend** — built the tab container, the COA placeholder list, and the spec-sheets list + dialog with print; wired the container into the page.
4. **Verification** — typecheck + lint on all touched files.

## Files Modified
- `config/filemaker.ts`
  - Added `qualityParameters: "Web_QPA"` to `FILEMAKER_LAYOUTS`.
- `services/filemakerService.ts`
  - Added `OrderSpecSheetParameter` and `OrderSpecSheetItem` types + `mapSpecSheetParameter`.
  - `getQualityParameters(specSheetId)` — queries `Web_QPA` with `ID_fk == id`, `Type == "CST"`, `COMMENT == "Comments"`, sorted by `SortOrder` ascending; maps `ParameterName/ParameterValue/MinValue/MaxValue/Unit/MethodReference`; returns `[]` on no-records.
  - `getOrderSpecSheets(poNumber)` — Step 1 reads line items from `Web_MLI` with the `MLI_CSTD__ContactId_ItemNo::ID/USSMID_Item/Approved` related fields; Step 2 fetches QPA parameters in parallel for each item with a spec sheet ID.
- `app/api/orders/spec-sheets/route.ts` (new)
  - `GET` validating `vendorId`/`poNumber`, confirming the PO belongs to the vendor, returning `{ success, specSheets }`.
- `components/order-coa-list.tsx` (new)
  - Per-line-item numbered list with an empty "Not available yet" COA slot per item (placeholder for future Drive sync).
- `components/order-spec-sheets.tsx` (new)
  - Fetches `/api/orders/spec-sheets`; numbered list of items with spec sheet name + Approved/Pending badge; clicking opens a "Specification Sheet" dialog with the parameters table (Analyte, Result, Min. Value, Max. Value, Units, Method Reference) and Print + Close. Print opens a clean printable window and calls `window.print()`. Loading/empty/error states handled.
- `components/order-documents-tabs.tsx` (new)
  - Tab bar (Import Documents | COA | Specification Sheets); Import is the existing `OrderDocumentsPanel`; COA/Spec tabs mount lazily on first activation and stay mounted (hidden) to preserve state and avoid re-fetch.
- `app/dashboard/orders/[poNumber]/page.tsx`
  - Replaced the direct `<OrderDocumentsPanel />` with `<OrderDocumentsTabs />`, passing `order.lineItems` (itemNo/productName) for the COA tab.

## Notes / Decisions
- **No circular import**: the spec-sheets route imports the FileMaker service only; COA uses line items passed from the page (no extra fetch).
- **Lazy tab mounting** avoids the spec-sheet QPA queries running on page load when the user never opens that tab.
- **Print** uses a new-window printable view (title + table) to avoid print-CSS scoping against the whole app; falls back to nothing if a popup is blocked (can add `@media print` fallback if needed).
- **`COMMENT == "Comments"`** used verbatim as a QPA find criterion per the approved plan.
- **Read-only**: no writes, no dependency/auth/env changes.

## Risks / Follow-ups (FileMaker-side, not code defects)
- The `MLI_CSTD__ContactId_ItemNo::*` related fields must be on the `Web_MLI` layout, and `Web_QPA` must exist with the queried fields, for spec sheets to populate. If absent, Step 1/2 return empty (same layout-dependency class as the T-024 `ItemPacked&ReadyToShip` note).

## Post-Review Refinements (developer feedback)
- **Tabs relocated** inside the "Manage order documents" card (the card supplies the heading + a segmented tab bar). Active tab is solid primary with white text; inactive is muted — clear highlight.
- **Import panel** refactored to content-only (card chrome moved to the tab container); counts row retained.
- **Specification Sheets** changed from list→modal to a **master-detail** layout matching Import Documents: left selectable list (first item auto-selected), right detail panel with the parameter table and a **Print** button.
- **Print window** now auto-closes after print/save via `onafterprint` (no lingering about:blank window).
- **Approved/Pending badge removed** from the spec sheets view per request — specs only.
- **COA** rebuilt as a master-detail panel mirroring Import Documents (left line-item list, right placeholder "will sync from Google Drive").
- **List highlight** aligned to Import Documents (row icon muted by default, primary when active).
- **Closed-PO lock (whole order read-only)**: when status is `closed`/`voided`, vendor actions, vendor comments, and document upload/delete are all disabled in the UI and rejected on the server. Added `assertNotClosed` (acknowledge + all PO writes + comments) and `isPurchaseOrderClosed` (guarding the upload and delete routes); the actions route also fails fast with a closed check.
- **Caret fix**: disabled/read-only inputs no longer show a blinking caret (`caret-color: transparent` in `app/globals.css`).

## Additional Files Modified (refinements)
- `app/globals.css` — caret-color transparent for disabled/readonly inputs.
- `components/order-documents-panel.tsx` — content-only refactor + `disabled` prop.
- `components/order-notes-comments.tsx` — `disabled` prop (closed-PO lock).
- `components/order-status-actions.tsx` — `orderStatus`/`isLocked` to lock all actions when closed.
- `app/api/orders/actions/route.ts`, `app/api/orders/documents/upload/route.ts`, `app/api/orders/documents/delete/route.ts` — closed-PO guards.

## Verification
- `npx tsc --noEmit` → exit 0, no errors.
- `npx eslint` on all touched code files → exit 0, clean.
- Manual browser verification by developer: three tabs render in the Manage order documents card; Import unchanged; COA per-item master-detail placeholder; Specification Sheets master-detail with parameter table + working Print (auto-closing window); closed-PO locks actions/comments/uploads. Confirmed working.
