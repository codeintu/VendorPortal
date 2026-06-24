# Plan: P-028-ponumber-new-versioned-migration

Ticket: [T-028-ponumber-new-versioned-migration](../tickets/T-028-ponumber-new-versioned-migration.md)
Status: PROPOSED — awaiting approval
Created: 2026-06-24

## Implementation Strategy

`PONumber` stays the **internal key** — routing, detail fetch, line items, spec
sheets, and every update already key off it and **do not change**. We only:

1. **Add a display field** `poNumberDisplay` (from `PoNumber_new`) to the mapped PO
   record and thread it to the three places a PO number is shown.
2. **Filter every PO listing to the latest version** (`LatestPOVersion == 1`) and
   **search by `PoNumber_new`** — both inside `getVendorPOs` (which also feeds the
   dashboard through `getAllVendorPOs`).
3. **Name Google Drive folders by `PoNumber_new`** in the two services that resolve
   the PO folder.

Because the orders API spreads the full mapped record, adding `poNumberDisplay` in
`mapPurchaseOrderRecord` makes it available to the API response automatically; the
only client work is widening the order types and rendering the new field.

## Step-by-Step Tasks

### Step 1 — Service: mapped record + types
File: [services/filemakerService.ts](../../services/filemakerService.ts)
- In `PurchaseOrderRecord` type (~line 11), add `poNumberDisplay: string;`.
- In `mapPurchaseOrderRecord` (~line 324), add
  `poNumberDisplay: normalizeFieldValue(fieldData.PoNumber_new),`
  immediately after the existing `poNumber: normalizeFieldValue(fieldData.PONumber),`
  (keep `poNumber` exactly as-is — it remains the internal key).

### Step 2 — Service: latest-version filter + search field (`getVendorPOs`, ~line 440)
- Add to the base `query` object: `LatestPOVersion: '==1'` (alongside `VendorID`).
- Change the search branch from
  `query.PONumber = '*' + searchTerm + '*'` to
  `query.PoNumber_new = '*' + searchTerm + '*'`.
- Leave sort (`DateEntered descend`), paging, and `totalCount`/`hasNextPage` logic as-is;
  `foundCount` now honors the version predicate, so totals stay correct (verify in Step 6).
- No change to `getVendorPOByNumber`, `getVendorPORecordByNumber`, `getPurchaseOrderLineItems`,
  `getOrderSpecSheets`, or any update function — they stay keyed on internal `PONumber`.

### Step 3 — Client order type + list/dashboard display
- [app/dashboard/dashboard-data-context.tsx](../../app/dashboard/dashboard-data-context.tsx):
  add `poNumberDisplay: string` to the `PurchaseOrder` type (~line 29).
- [app/dashboard/orders/page.tsx](../../app/dashboard/orders/page.tsx):
  - Display cell (~line 201): render `order.poNumberDisplay || EMPTY_VALUE`.
  - Row link / `router.push` (~lines 192, 196) and `rowKey` (~line 184): keep
    `order.poNumber` (internal — routing must stay on the real key).
- [app/dashboard/page.tsx](../../app/dashboard/page.tsx) (dashboard recent orders):
  - Display cell (~line 262): render `order.poNumberDisplay || EMPTY_VALUE`.
  - `orderHref` / `rowKey` (~lines 239–240, 238): keep `order.poNumber` (internal).

### Step 4 — Detail page heading + header type
File: [app/dashboard/orders/[poNumber]/page.tsx](../../app/dashboard/orders/[poNumber]/page.tsx)
- Add `poNumberDisplay: string` to the `header` object in the `OrderDetails` type (~line 15).
- Heading (~line 275): change `Order #{order.header.poNumber}` to
  `Order #{order.header.poNumberDisplay}`.
- Everything else on this page (the `poNumber` route param at ~line 143, the
  `/api/orders/details?...poNumber=` fetch, and the `poNumber={poNumber}` props passed to
  `OrderStatusActions` / documents / spec-sheets / comments) **stays on the internal number**.

### Step 5 — Google Drive folder naming (use `PoNumber_new`)
- [services/orderDocumentsService.ts](../../services/orderDocumentsService.ts) (~line 145):
  change `const poFolderName = ` + "`PO ${poNumber}`" + ` to use the header value, e.g.
  `PO ${order.header.poNumberDisplay}` (the function already loads `order` at ~line 128).
- [services/orderDocumentUploadService.ts](../../services/orderDocumentUploadService.ts):
  it already fetches order details (~line 126); use `order.header.poNumberDisplay` in the
  folder lookup (~line 152) and the two error strings (~lines 155, 161).
- **Delete** ([services/orderDocumentDeleteService.ts](../../services/orderDocumentDeleteService.ts)):
  no change. It guards by the Drive file's stored `PONumber` property vs. the internal
  `poNumber` passed from the route (~lines 51, 57); upload also tags the file with the
  internal `PONumber` (~line 186). Keeping both ends on the internal number preserves the guard.
  (Only the **folder name** moves to `PoNumber_new`; the file's `PONumber` metadata stays internal.)
- Use the `PoNumber_new` value **verbatim** for the folder name — do not add or strip any
  `.1`/`.2` version suffix (per developer decision).

### Step 5b — Send-invoice email shows `PoNumber_new`
File: [services/orderInvoiceService.ts](../../services/orderInvoiceService.ts)
- The order is already fetched by internal `poNumber` (~line 41), so `order.poNumberDisplay`
  is available.
- Subject (~line 81), plaintext body (~line 85), and HTML body (~line 94): replace the
  `poNumber` reference with `order.poNumberDisplay` (escape it the same way in the HTML body).
- Keep the internal `poNumber` for `getVendorPOByNumber` (~line 41),
  `getOrderDocumentsForVendor` (~line 53), and `updateVendorInvoiceNo` (~line 115).

### Step 6 — Verification
- `npx tsc --noEmit` across touched files.
- Dry-run against a vendor with a versioned PO:
  - Orders list & dashboard show one row per PO; the number reads as `PoNumber_new` (e.g. `12345.2`).
  - Search by the `.x` display number returns the order.
  - Clicking it opens the detail page (URL has the internal `PONumber`); heading shows `PoNumber_new`.
  - Header, line items, spec sheets load; acknowledge + each date update succeed (record found by `PONumber`).
  - Document tab lists files from the `PO <PoNumber_new>` Drive folder; upload, preview, delete work.

## Files Expected to Change
- [services/filemakerService.ts](../../services/filemakerService.ts) — Steps 1, 2. **Primary.**
- [app/dashboard/dashboard-data-context.tsx](../../app/dashboard/dashboard-data-context.tsx) — Step 3 (type).
- [app/dashboard/orders/page.tsx](../../app/dashboard/orders/page.tsx) — Step 3 (display cell only).
- [app/dashboard/page.tsx](../../app/dashboard/page.tsx) — Step 3 (display cell only).
- [app/dashboard/orders/[poNumber]/page.tsx](../../app/dashboard/orders/[poNumber]/page.tsx) — Step 4 (type + heading).
- [services/orderDocumentsService.ts](../../services/orderDocumentsService.ts) — Step 5 (folder name).
- [services/orderDocumentUploadService.ts](../../services/orderDocumentUploadService.ts) — Step 5 (folder name).
- [services/orderInvoiceService.ts](../../services/orderInvoiceService.ts) — Step 5b (email subject/body text).
- **No change:** detail/line-item/spec-sheet/update queries, the orders & details API routes,
  the document delete service, and `[poNumber]` routing/props.

## Potential Risks
1. **`LatestPOVersion` query syntax / value.** If the field is empty or not `1` on rows
   expected to show, the list could come back empty. Mitigation: verify `'==1'` against a
   real latest-version record in Step 6 before considering the step done.
2. **Drive folder for versioned POs.** Folders are resolved by the `PoNumber_new` value used
   verbatim (developer-confirmed). Still worth a Step 6 spot-check that a versioned PO's
   `PoNumber_new` matches its real Drive folder name, since a mismatch silently empties the
   document tabs.
3. **Mixed number on detail page.** The URL shows the internal `PONumber` while the heading
   shows `PoNumber_new`. This is intended per the ticket, but worth confirming it reads fine
   to the vendor (no other on-page label exposes the internal number).
4. **Pagination drift.** `foundCount` should reflect the `LatestPOVersion` predicate (same
   find), keeping totals correct; verify in Step 6.

## Rollback
All changes are confined to one service field-mapping/query, three display cells, one heading,
and two Drive folder strings. Reverting the commit fully restores prior behavior; no data
migration is performed.
