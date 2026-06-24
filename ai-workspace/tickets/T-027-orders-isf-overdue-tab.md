# Ticket: T-027-orders-isf-overdue-tab

Status: PROPOSED
Created: 2026-06-24
Author: AI Agent

## Problem Statement
On the Orders list ([app/dashboard/orders/page.tsx](../../app/dashboard/orders/page.tsx)) vendors can filter by status using tabs (All / Open / Closed / AP Pending). There is no way to quickly find orders that are **at risk of an ISF compliance gap** — orders whose **estimated ship date has already passed** but which **still have no ISF Document on file**.

US Spice needs the vendor to be able to see, in one place, every order that is overdue (est. ship date in the past) and missing its ISF Document, so the vendor can chase the missing paperwork.

## Goal
Add a new tab to the Orders list (alongside All / Open / Closed / AP Pending) that shows only the orders matching **both** conditions:
1. **Overdue** — the order's **Est. Ship Date** (`DateScheduledArrival`) is a valid date strictly before today.
2. **Missing ISF** — the order has **no "ISF Document"** in its Google Drive document set (i.e. the ISF document status is "Not uploaded").

When the tab is selected, the list shows only those orders, reusing the existing table layout (PO number, dates, amount, status), so the vendor can click through to each order and upload the missing ISF.

## Important Context (data sources)
- **Est. ship date** is a FileMaker field on the purchase order (`DateScheduledArrival`, surfaced today as the "EST. SHIP DATE" column → `dateScheduled`). It is queryable in FileMaker.
- **ISF presence is NOT in FileMaker.** It is derived from Google Drive — the order's `Docs` folder is resolved (vendor folder → `PO VR <year>` → `PO <poNumber>` → `Docs`) and each file's Drive label is read to find one tagged "ISF Document" (see `getOrderDocumentsForVendor` in [services/orderDocumentsService.ts](../../services/orderDocumentsService.ts)).
- Consequence: this tab **cannot** be a single FileMaker status query like the other tabs. It needs a FileMaker prefilter (overdue orders) followed by a per-order Drive check for the ISF document. This is inherently heavier than the existing tabs.

## Key Decisions To Confirm (at approval)
1. **Tab label.** Proposed: **"ISF Overdue"** (short, fits the existing tab row). Alternatives: "Missing ISF", "ISF Alerts". Confirm preferred label.
2. **What counts as "overdue".** Proposed: `DateScheduledArrival` is non-empty, parses as a date, and is strictly before today. Empty/blank ship dates are **excluded** (not treated as overdue).
3. **Exclude already-shipped / closed orders?** Proposed: **yes** — exclude orders that are Closed or Voided, and orders that already have an `OrderShippedDate`. Rationale: a missing ISF on an order that already shipped or closed is no longer an actionable "chase it" item, so it would only add noise. Confirm — or include them regardless of status.
4. **Result cap.** Because each candidate needs a Drive lookup, the candidate set from FileMaker is capped (proposed **200** most-overdue orders) and the cap is surfaced in the UI if hit. Confirm the cap is acceptable.
5. **Search box behavior on this tab.** Proposed: the PO search box is disabled/ignored while this tab is active (the tab is a fixed compliance view). Confirm.

## Scope
1. **Backend query (FileMaker):** add a service that returns the vendor's overdue, not-yet-shipped, non-closed purchase orders (candidate set), sorted by est. ship date, capped.
2. **Backend orchestration (Drive):** for each candidate, check whether an "ISF Document" exists in the order's Drive `Docs` folder; keep only those missing it. Run the checks with a bounded concurrency limit.
3. **API route:** new `GET /api/orders/isf-overdue?vendorId=...` returning `{ success, orders, totalCandidates, capped }`.
4. **Frontend:** add the new tab to the Orders list. When active, fetch from the new endpoint into page-local state, render the same table, show a count and a "missing ISF & overdue" empty state, and a clear (slower) loading state. The existing tabs are unchanged.

## Out of Scope
- Changing how ISF (or any) documents are uploaded, synced, or labeled.
- Any server-side persistence/flagging of "overdue" status back into FileMaker.
- Adding the same overdue/ISF logic to the dashboard summary or other screens.
- Auth, environment, or `package.json` dependency changes.
- Notifying/emailing vendors about overdue ISF (separate concern; could be a later ticket).

## Acceptance Criteria
- [ ] A new tab (label per decision #1) appears in the Orders list tab row.
- [ ] Selecting the tab shows only orders that are overdue (est. ship date in the past) **and** missing their ISF Document.
- [ ] Orders with no est. ship date are not shown; closed/voided/already-shipped orders are excluded (per decisions #2/#3).
- [ ] The list reuses the existing table columns and row click-through to the order detail page.
- [ ] A loading state communicates that this view is doing extra work (Drive lookups); an empty state reads clearly ("No overdue orders are missing an ISF document").
- [ ] If the candidate cap is hit, the UI indicates the list may be partial.
- [ ] Existing tabs (All / Open / Closed / AP Pending), search, and pagination are unaffected.
- [ ] Touched files pass TypeScript compilation and lint verification.

## Notes
- Performance: this tab issues one Drive document lookup per candidate order. The cap + bounded concurrency keep it sane, but it will be visibly slower than the other tabs — the UI must set that expectation. An optional caching/optimization pass is noted in the plan.
