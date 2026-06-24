# Implementation Plan: P-027-orders-isf-overdue-tab

Linked Ticket: T-027-orders-isf-overdue-tab

## Objective
Add an "ISF Overdue" tab to the Orders list that surfaces only orders whose **est. ship date (`DateScheduledArrival`) is in the past** AND that have **no "ISF Document"** in their Google Drive document set. Because ISF presence lives in Drive (not FileMaker), this is a two-stage filter: a FileMaker prefilter for overdue candidates, then a per-order Drive ISF check.

## Key Assumptions (please confirm at approval)
1. **Est. ship date = `DateScheduledArrival`** (the field already mapped to `dateScheduled` and shown as "EST. SHIP DATE"). "Overdue" = non-empty, parses as a date, strictly before today.
2. **Exclusions:** Closed/Voided orders and orders with a non-empty `OrderShippedDate` are excluded from candidates (actionable "chase it" list only). Status filtering for closed/voided is done in code after the find (simpler than FileMaker omit queries); not-shipped is expressed in the find itself.
3. **ISF detection reuses existing label logic:** an order "has ISF" iff its `Docs` folder contains a file whose Drive document-type label resolves to `"ISF Document"` (same mapping `getOrderDocumentsForVendor` already uses). Missing = "Not uploaded".
4. **Candidate cap = 200**, sorted by `DateScheduledArrival` ascending (most overdue first). If FileMaker reports more than the cap, the response flags `capped: true`.
5. **Concurrency** for Drive checks is bounded (proposed 5 at a time) to avoid hammering the Drive API.
6. **This tab ignores the PO search box** and uses its own page-local state rather than the shared `useDashboardData` orders pagination (which is built around FileMaker server paging). The existing tabs/flow are untouched.

## Proposed Approach

### 1. FileMaker candidate query (`services/filemakerService.ts`)
- Add `getOverdueUnshippedPOs(vendorId, { limit = 200 })`:
  - Build a `_find` against `FILEMAKER_LAYOUTS.purchaseOrders` with:
    - `VendorID: =="<vendorId>"`
    - `DateScheduledArrival: "<<MM/DD/YYYY>"` (strictly before today; FileMaker date find using the account's date format — use a small helper to format "today"). Confirm the FileMaker date format during testing; adjust the formatter if the server expects `M/D/YYYY` vs `MM/DD/YYYY`.
    - `OrderShippedDate: "="` (empty / not yet shipped).
  - `sort: [{ fieldName: "DateScheduledArrival", sortOrder: "ascend" }]`, `limit`.
  - Map rows via the existing `mapPurchaseOrderRecord`.
  - Return `{ orders: PurchaseOrderRecord[], totalCount, capped }` (`capped = totalCount > limit`). Handle the FileMaker 401 "no records" case → empty result (same pattern as `getVendorPOs`).
- Additive only; `getVendorPOs` and all existing callers are unchanged.

### 2. Lean ISF presence check + orchestration (`services/orderDocumentsService.ts`)
- Add `orderHasIsfDocument(args)` — a **lighter** variant of the work in `getOrderDocumentsForVendor` that does not re-fetch vendor summary / PO details per call:
  - Inputs: `vendorFolderId` (resolved once for the vendor), `poNumber`, `dateEntered` (already on the candidate record → derive `year`).
  - Resolve `PO VR <year>` → `PO <poNumber>` → `Docs`; if any link is missing → treat as **missing ISF** (returns `false`).
  - List the `Docs` files, read their labels, and return `true` iff one resolves to document type `"ISF Document"`. Reuse the existing label helpers (`buildDocumentTypeMap` logic / `DOCUMENT_TYPE_BY_LABEL_CHOICE_ID`); refactor the shared bit into a small internal helper so both this and `getOrderDocumentsForVendor` use one implementation (no behavior change to the existing function).
- Add `getOrdersMissingIsfOverdue(vendorId)`:
  1. `getOverdueUnshippedPOs(vendorId)` → candidates.
  2. Filter out Closed/Voided in code (case-insensitive on `status`).
  3. Resolve the vendor's Drive folder **once** (reuse the vendor-folder resolution already in `getOrderDocumentsForVendor`, extracted into a helper `resolveVendorDriveFolderId(vendorSummary)`).
  4. For each remaining candidate, run `orderHasIsfDocument` with bounded concurrency (simple promise-pool, limit 5); keep only those where it returns `false`.
  5. Return `{ orders, totalCandidates, capped }`.
- Note: this introduces N Drive lookups (one per candidate). The cap + concurrency keep it bounded; flagged as the main performance cost.

### 3. API route (`app/api/orders/isf-overdue/route.ts`, new)
- `GET` with required `vendorId`.
- Call `getOrdersMissingIsfOverdue(vendorId)`.
- Return `{ success: true, orders, totalCandidates, capped }`; mirror the error shape of [app/api/orders/route.ts](../../app/api/orders/route.ts).

### 4. Frontend (`app/dashboard/orders/page.tsx`)
- Add `"ISF Overdue"` to the `statusTabs` array (label per ticket decision #1).
- Treat it as a **special tab**:
  - Add page-local state: `isfOrders`, `isfLoading`, `isfError`, `isfCapped`.
  - When the tab is selected, clear search and call the new endpoint (a local `loadIsfOverdue(vendorId)`), not `loadFilteredOrders`.
  - Disable the PO search input while this tab is active (decision #6), and hide the FileMaker-paged pagination footer (the result is a single capped set).
  - Render the **same table** but driven by `isfOrders` when the tab is active, and `orders` otherwise. Extract a small `renderRows(list)` or branch the data source so the table markup isn't duplicated.
  - Loading state copy makes clear it's checking documents (e.g. "Checking ISF documents across overdue orders…"); empty state: "No overdue orders are missing an ISF document."; if `isfCapped`, show a small note that the list may be partial (top N most overdue).
- The existing All/Open/Closed/AP Pending behavior, `useDashboardData`, and pagination are untouched.

## Files Expected To Change
- `services/filemakerService.ts` — add `getOverdueUnshippedPOs` (+ a today-as-FileMaker-date helper).
- `services/orderDocumentsService.ts` — add `orderHasIsfDocument`, `getOrdersMissingIsfOverdue`, and extract shared vendor-folder-resolution + label-map helpers (no behavior change to `getOrderDocumentsForVendor`).
- `app/api/orders/isf-overdue/route.ts` — new GET endpoint.
- `app/dashboard/orders/page.tsx` — new tab, special-tab branch, page-local state, loading/empty/capped states.

## Risks / Notes
- **Performance (headline).** One Drive folder-chain + file-list + label lookup per candidate order. Mitigated by the FileMaker prefilter, the 200-cap, and bounded concurrency — but this tab will be noticeably slower than the others; the UI sets that expectation. Optional later optimization: cache ISF presence per (vendor, PO) for a short TTL.
- **FileMaker date format.** The `DateScheduledArrival` range find depends on the server's date format; the formatter is isolated in one helper and will be verified during testing. If `OrderShippedDate: "="` (empty match) behaves unexpectedly, fall back to fetching candidates by date only and filtering shipped/empty in code.
- **Folder-chain gaps = treated as missing ISF.** If an order's Drive folders don't exist yet, it counts as missing ISF (correct for a "chase the paperwork" list) — flagged so it isn't read as a bug.
- **Label dependency.** ISF detection relies on the Drive document-type label being applied (same dependency the existing document panel already has). No new dependency.
- Read-only feature; no writes, no auth/env/dependency changes.

## Acceptance Criteria
- [ ] New "ISF Overdue" tab appears next to the existing tabs.
- [ ] Selecting it lists only orders that are overdue (past `DateScheduledArrival`) AND missing an "ISF Document" in Drive.
- [ ] Orders with no est. ship date are excluded; closed/voided/already-shipped orders are excluded (per assumptions).
- [ ] Rows reuse the existing columns and click through to the order detail page.
- [ ] Loading state signals the extra Drive work; empty state and `capped` note read clearly.
- [ ] Existing tabs, search, and pagination are unaffected.
- [ ] New service functions are additive; `getOrderDocumentsForVendor` behavior is unchanged.
- [ ] Touched files pass TypeScript compilation and lint verification.
