# Test Scenarios: TEST-028-ponumber-new-versioned-migration

Ticket: [T-028-ponumber-new-versioned-migration](../tickets/T-028-ponumber-new-versioned-migration.md)
Status: VERIFIED — developer confirmed working in the running app

## Preconditions
- A vendor login with at least one PO that has **multiple versions** (one row with
  `LatestPOVersion = 1` and at least one older version row), where `PoNumber_new` differs
  from the internal `PONumber`.
- At least one PO with documents already uploaded to its `PO <PoNumber_new>` Drive folder.
- An acknowledged PO with an uploaded Invoice document (for the send-invoice test).

## Display & Latest-Version Filtering
- [ ] Orders list shows the **`PoNumber_new`** value in the PO-number column (not the internal `PONumber`).
- [ ] Each logical PO appears **once** — older versions (`LatestPOVersion ≠ 1`) do not appear.
- [ ] Dashboard "recent orders" shows `PoNumber_new` and only latest-version rows.
- [ ] Dashboard counts (active / AP pending / closed) reflect latest-version rows only.

## Search
- [ ] Searching by the **`PoNumber_new`** value returns the matching latest-version order.
- [ ] Searching by an old internal `PONumber` does **not** return the order (search is on `PoNumber_new`).
- [ ] Partial search (substring of `PoNumber_new`) still matches.

## Routing & Detail Page
- [ ] Clicking an order opens its detail page; the page loads header, line items, and spec sheets.
- [ ] The detail heading shows **`Order #<PoNumber_new>`**.
- [ ] The detail URL contains the **internal `PONumber`** (expected/intended).
- [ ] Line items and spec sheets are correct for that PO (proves the internal-key MLI query still works).

## Vendor Actions (internal-key updates)
- [ ] Acknowledge order → succeeds and persists (record found by internal `PONumber`).
- [ ] Update Est. Ship Date → succeeds; reflects in both the status timeline and the Shipping & Delivery card.
- [ ] Update Packed & Ready date → succeeds.
- [ ] Order Shipped (date + tracking) → succeeds.

## Documents (Drive keyed by PoNumber_new)
- [ ] Document tab lists files from the `PO <PoNumber_new>` Drive folder.
- [ ] Upload a document → lands in the `PO <PoNumber_new>` Docs folder and appears in the tab.
- [ ] Preview a document → opens correctly.
- [ ] Delete a vendor-uploaded document → succeeds (delete guard still matches on the internal `PONumber` property).

## Send Invoice (display in email, internal key for persistence)
- [ ] Enter an invoice number and send → email is sent.
- [ ] The email **subject** and **body** show `PoNumber_new` (not the internal number).
- [ ] The invoice number is persisted to the correct record (found by internal `PONumber`).

## Pagination
- [ ] Page count / "next page" behave correctly with latest-version-only results.
- [ ] Total count matches the number of latest-version POs for the vendor.

## Regression / Build
- [x] `npx tsc --noEmit` passes.
- [x] `npx eslint` on touched files passes.
- [ ] No console errors on the orders list, dashboard, or detail page.

## Test Results
- Developer verified in the running app: orders list shows `PONumber_new` and behaves correctly.
- Root-cause fix during verification: FileMaker field name is `PONumber_new` (capital "PO"), not
  `PoNumber_new`; mapping + search updated to the exact name.
- `tsc --noEmit` and `eslint` on all touched files pass.
