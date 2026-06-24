# Implementation Plan: P-025-document-section-tabs-coa-spec-sheets

Linked Ticket: T-025-document-section-tabs-coa-spec-sheets

## Objective
Split the Order Details document section into three tabs — Import Documents (existing), COA (per-item, placeholder), and Specification Sheets (per-item, fetched from FileMaker `Web_MLI` + `Web_QPA`).

## Key Assumptions (please confirm at approval)
1. **Tabs are a presentation wrapper.** The existing document panel moves under the "Import Documents" tab with no behavior change.
2. **COA has no data source yet.** The COA tab is built from the PO line items (item no + product name) with an empty "COA not available yet" slot per item — structure only, ready for a later Drive-sync ticket.
3. **Spec sheets are read-only** and fetched live from FileMaker per the provided two-step process.
4. **`COMMENT = "Comments"`** is used verbatim as a QPA find criterion as specified. (Flagging because it's an unusual literal; if it should be different — e.g. exclude/empty — tell me and I'll adjust the single query.)
5. Step 1 uses the existing `Web_MLI` layout (already the line-items layout); the CSTD spec-sheet fields are related fields on that layout and come back in `fieldData` keyed as `MLI_CSTD__ContactId_ItemNo::<field>`.
6. COA line-item list is passed from the page's already-loaded `order.lineItems` (no extra fetch); Spec Sheets are fetched on demand when that tab needs data.

## Proposed Approach

### 1. Config (`config/filemaker.ts`)
- Add `qualityParameters: "Web_QPA"` to `FILEMAKER_LAYOUTS`.

### 2. Backend (`services/filemakerService.ts`)
- Add types: `OrderSpecSheetParameter` (`parameterName`, `parameterValue`, `minValue`, `maxValue`, `unit`, `methodReference`) and `OrderSpecSheetItem` (`itemNo`, `productName`, `specSheetId`, `specSheetName`, `approved: boolean`, `parameters: OrderSpecSheetParameter[]`).
- Add `getQualityParameters(specSheetId)`:
  - Query `Web_QPA` with `{ ID_fk: ==<id>, Type: =="CST", COMMENT: =="Comments" }`, `sort: [{ fieldName: "SortOrder", sortOrder: "ascend" }]`.
  - Map rows to `OrderSpecSheetParameter` via `pickFieldValue`.
  - Return `[]` on the FileMaker "no records" (401) case.
- Add `getOrderSpecSheets(poNumber)`:
  - Query `Web_MLI` by `PONumber` (reuse the existing line-items query pattern), reading `ItemNo`, `ProductName`, and the three `MLI_CSTD__ContactId_ItemNo::*` related fields.
  - For each item with a non-empty spec sheet ID, call `getQualityParameters(id)` (in parallel) and attach the parameters; items without an ID are returned with `specSheetId: ""` and empty parameters.
  - Return `OrderSpecSheetItem[]`.
- These are additive; the existing `mapLineItemRecord`/`getPurchaseOrderLineItems` used by Order Details are left unchanged.

### 3. API route (`app/api/orders/spec-sheets/route.ts`, new)
- `GET` with `vendorId` + `poNumber`.
- Validate the PO belongs to the vendor (reuse `getVendorPOByNumber`) → 404 if not found.
- Return `{ success: true, specSheets: OrderSpecSheetItem[] }`.
- Mirror the error handling shape of `app/api/orders/details/route.ts`.

### 4. Frontend
- **New `components/order-documents-tabs.tsx`** (client): renders the section card with a three-tab header (Import Documents | COA (Certificate of Analysis) | Specification Sheets) styled to match the theme, and switches content by active tab. Props: `vendorId`, `poNumber`, `lineItems` (itemNo/productName for COA).
  - **Import Documents**: renders the existing `<OrderDocumentsPanel />`. To avoid a doubled card, the panel's outer section chrome is reused as-is (the tab container supplies the heading/tabs; the panel keeps its internal layout). Minimal/no change to the panel itself.
  - **COA tab** (`components/order-coa-list.tsx`, new): a numbered per-item list (item no + product name) with an individual COA slot per item showing an empty "COA not available yet" state and a disabled placeholder action, ready for future Drive wiring.
  - **Specification Sheets tab** (`components/order-spec-sheets.tsx`, new): fetches `/api/orders/spec-sheets` on first activation; renders a per-item list (numbered, like the legacy view) with the spec sheet name and an Approved/Pending badge. Selecting an item opens a **"Specification Sheet" dialog**:
    - Table columns: **Analyte** (`parameterName`), **Result** (`parameterValue`), **Min. Value** (`minValue`), **Max. Value** (`maxValue`), **Units** (`unit`), **Method Reference** (`methodReference`); scrollable for long parameter lists.
    - **Print** action and a **Close** action.
    - **Print approach:** open a minimal printable view in a new window containing just the spec sheet title + table and trigger `window.print()` on it (avoids print-CSS scoping issues against the whole app and gives a clean printout). Fallback note: if a new window is blocked, fall back to a scoped `@media print` block. Will confirm the printout looks right during testing.
    - Handles loading, empty (no spec sheet / no parameters), and error states.
- **Page (`app/dashboard/orders/[poNumber]/page.tsx`)**: replace the direct `<OrderDocumentsPanel />` render with `<OrderDocumentsTabs vendorId={vendorId} poNumber={poNumber} lineItems={order.lineItems} />`.

## Files Expected To Change
- `config/filemaker.ts` (add `Web_QPA`)
- `services/filemakerService.ts` (spec-sheet + QPA types and fetchers)
- `app/api/orders/spec-sheets/route.ts` (new)
- `components/order-documents-tabs.tsx` (new — tab container)
- `components/order-coa-list.tsx` (new — COA placeholder list)
- `components/order-spec-sheets.tsx` (new — spec sheets + parameters)
- `app/dashboard/orders/[poNumber]/page.tsx` (render the tabbed container, pass line items)

## Risks / Notes
- **Related-field availability.** The `MLI_CSTD__ContactId_ItemNo::*` fields must be on the `Web_MLI` layout for the Data API to return them; if absent, Step 1 returns empty and spec sheets won't show (same class of layout dependency seen with `ItemPacked&ReadyToShip` in T-024). Field names are accessed via `pickFieldValue` candidate lists to ease adjustment.
- **`COMMENT = "Comments"` criterion** is used as given; flagged above for confirmation.
- **N+1 queries.** One QPA query per spec-sheet item; runs in parallel and is acceptable for the small number of line items per PO. Will note if a PO has unusually many items.
- **COA placeholder only** — no Drive calls; clearly labeled so it doesn't read as "synced/empty from Drive".
- Read-only; no writes, no dependency/auth/env changes.

## Acceptance Criteria
- [ ] Three tabs render (Import Documents, COA, Specification Sheets) matching the card theme.
- [ ] Import Documents tab preserves the current panel and behavior.
- [ ] COA tab lists each line item with an empty per-item COA slot.
- [ ] Specification Sheets tab lists items with spec sheet name + Approved/Pending status.
- [ ] Selecting a spec sheet opens a "Specification Sheet" dialog with a parameters table (Analyte, Result, Min. Value, Max. Value, Units, Method Reference) from `Web_QPA`.
- [ ] The dialog provides Print (prints the spec sheet) and Close.
- [ ] `Web_QPA` added to `config/filemaker.ts`.
- [ ] Loading/empty/error states handled.
- [ ] Touched files pass TypeScript compilation and lint verification.
