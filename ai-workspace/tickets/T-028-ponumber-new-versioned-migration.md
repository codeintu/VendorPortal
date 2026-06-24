# Ticket: T-028-ponumber-new-versioned-migration

Status: COMPLETED
Created: 2026-06-24
Completed: 2026-06-24
Author: AI Agent

## Problem Statement
On the FileMaker side, purchase orders are now **versioned**. A single logical PO
can exist as multiple version rows, each with its own internal `PONumber`. The
business has introduced two fields:

- **`PoNumber_new`** — a **display-only** PO number shown to the vendor
  (e.g. version 2 of PO `12345` is shown as `12345.2`).
- **`LatestPOVersion`** — a flag; the current/active version row has `LatestPOVersion = 1`.

**`PONumber` remains the internal identifier.** When a new version of PO `12345`
is created, the vendor sees `12345.2`, but internally it is a brand-new record
with a different `PONumber` (e.g. `12346`). All internal relationships still key
off `PONumber`:
- The order-detail record is fetched by `PONumber`.
- Line items and spec sheets (`Web_MLI`) are linked by `PONumber`.
- All status/date/invoice updates target the record found by `PONumber`.

So the portal must keep using `PONumber` internally, while surfacing
`PoNumber_new` to the vendor and restricting list/search views to the latest
version (`LatestPOVersion = 1`).

## Goal
1. **Display** `PoNumber_new` (not `PONumber`) wherever a PO number is shown to the
   vendor — orders list, dashboard recent orders, and the order-detail heading.
2. **List/search only the latest version** — every PO listing filters
   `LatestPOVersion = 1`, and the orders search box matches `PoNumber_new`.
3. **Keep `PONumber` as the internal key** for routing, detail fetch, line items,
   spec sheets, and all update operations (so clicking a listed order still
   resolves its record by `PONumber`).
4. **Google Drive** document folders use `PoNumber_new` (versions share/carry the
   same Drive folder; no new folder per version).

## Resolved Decisions (confirmed by developer)
1. **`Web_MLI` stays linked to `PONumber`.** Line items and spec sheets continue to
   be queried by `PONumber`. The detail page is reached via the internal `PONumber`,
   so these queries need **no change**. We keep the internal `PONumber` on the record
   (it is already `order.poNumber`) and use it for the route/redirect.
2. **Google Drive uses `PoNumber_new`.** The order's Drive folder is named
   `PO <PoNumber_new>` using the `PoNumber_new` value **verbatim** — no version suffix
   is added or stripped (don't append/remove `.1`/`.2`). All versions carry forward the
   same folder (no new folder per version). Folder resolution switches from the internal
   number to `PoNumber_new`.
3. **`PoNumber_new` is always populated** for `LatestPOVersion = 1` rows on the PO
   list. **No fallback** to `PONumber` is required for the displayed value.
4. **`LatestPOVersion = 1`** marks the latest version (numeric exact match).
5. **Search matches `PoNumber_new` only**, combined with the `LatestPOVersion = 1`
   filter.
6. **Invoice email shows `PoNumber_new`.** The send-invoice email subject and body
   reference the vendor-facing `PoNumber_new` (the record is still fetched and updated
   by internal `PONumber`).

## Important Context (current PONumber touch points)
All FileMaker access is centralized in [services/filemakerService.ts](../../services/filemakerService.ts).

- **Field read** — `mapPurchaseOrderRecord` reads `fieldData.PONumber` → `poNumber` ([:327](../../services/filemakerService.ts#L327)). Feeds `order.poNumber` everywhere (kept as the internal key).
- **Orders list** — `getVendorPOs` filters `VendorID` (+ `Status`), searches `PONumber` ([:450](../../services/filemakerService.ts#L450)), sorts by `DateEntered`; no version filter today. Also powers the dashboard via `getAllVendorPOs` → `getDashboardSummary`.
- **Detail lookup (read)** — `getVendorPOByNumber` matches `PONumber` ([:512](../../services/filemakerService.ts#L512)). **Stays on `PONumber`.**
- **Detail lookup (read + recordId for PATCH)** — `getVendorPORecordByNumber` matches `PONumber` ([:545](../../services/filemakerService.ts#L545)). **Stays on `PONumber`.**
- **Line items** — `getPurchaseOrderLineItems` matches `Web_MLI.PONumber` ([:889](../../services/filemakerService.ts#L889)). **Stays on `PONumber`.**
- **Spec sheets** — `getOrderSpecSheets` matches `Web_MLI.PONumber` ([:981](../../services/filemakerService.ts#L981)). **Stays on `PONumber`.**
- **Display & routing** — orders list shows + links `order.poNumber` ([app/dashboard/orders/page.tsx:201](../../app/dashboard/orders/page.tsx#L201), [:192](../../app/dashboard/orders/page.tsx#L192)); dashboard recent orders ([app/dashboard/page.tsx:262](../../app/dashboard/page.tsx#L262), [:239](../../app/dashboard/page.tsx#L239)); detail heading `Order #{order.header.poNumber}` ([app/dashboard/orders/[poNumber]/page.tsx:275](../../app/dashboard/orders/[poNumber]/page.tsx#L275)). Routing/links keep the internal number; **only the displayed text** changes to `PoNumber_new`.
- **Google Drive folder** — named `PO ${poNumber}` in [orderDocumentsService.ts:145](../../services/orderDocumentsService.ts#L145) and [orderDocumentUploadService.ts:152](../../services/orderDocumentUploadService.ts#L152). Both services already fetch the order header, so they can read `PoNumber_new`.

## Scope
1. Add a display field (`poNumberDisplay`, sourced from `PoNumber_new`) to the mapped
   PO record; keep `poNumber` = internal `PONumber`.
2. Thread `poNumberDisplay` through the orders API → client order type → list/dashboard
   rows and the detail header.
3. Show `poNumberDisplay` in: orders list cell, dashboard recent-orders cell, detail
   heading. Keep all route links / fetch params on the internal `poNumber`.
4. `getVendorPOs`: add `LatestPOVersion == 1`; change search field to `PoNumber_new`.
5. Google Drive folder naming: use `PoNumber_new` in `getOrderDocumentsForVendor` and
   `orderDocumentUploadService` (the document **delete** guard, which compares the
   internal `PONumber` Drive property, stays on the internal number end-to-end).
6. Send-invoice email: show `PoNumber_new` in the email subject and body (keep fetching
   the order and persisting the invoice number by internal `PONumber`).

## Out of Scope
- FileMaker schema/data changes (populating `PoNumber_new` / `LatestPOVersion`).
- Renaming or migrating existing Google Drive folders (assumed handled on the Drive side).
- Detail lookup, line-items, spec-sheets, and update queries — **unchanged** (still by `PONumber`).
- The proposed T-027 ISF-overdue tab (will inherit the version filter when built).
- Auth, environment, dependency, or UI-redesign changes.

## Acceptance Criteria
- [ ] Orders list and dashboard show **one row per logical PO** (latest version only).
- [ ] The PO number shown to the vendor (list, dashboard, detail heading) is `PoNumber_new`.
- [ ] Clicking a listed order opens its detail page resolved by the internal `PONumber`,
      and the heading shows `PoNumber_new`.
- [ ] Line items, spec sheets, acknowledge, est-ship/packed-ready/shipped updates, and
      send-invoice all resolve the correct record (by internal `PONumber`).
- [ ] The orders search box filters by `PoNumber_new` (latest version only).
- [ ] Document tabs resolve the Drive folder by `PoNumber_new`; upload/preview/delete work.
- [ ] The send-invoice email subject/body show `PoNumber_new`; the invoice number still
      persists to the record found by internal `PONumber`.
- [ ] Pagination total count / "next page" reflect the latest-version-only result set.
- [ ] Touched files pass TypeScript compilation and lint verification.

## Notes
- Clean seam: add one mapped field + a `LatestPOVersion` predicate in `getVendorPOs`,
  swap the search field, and switch Drive folder naming. Internal-key queries are
  untouched, which keeps the change low-risk.
- The order-detail URL will contain the internal `PONumber` (not the `.x` display
  number); the on-page heading shows `PoNumber_new`. This matches the "redirect using
  the old PONumber" decision.
