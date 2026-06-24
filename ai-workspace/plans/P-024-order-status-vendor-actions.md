# Implementation Plan: P-024-order-status-vendor-actions

Linked Ticket: T-024-order-status-vendor-actions

## Objective
Add an "Order Status" timeline (left) + "Vendor Actions" panel (right) to the Order Details screen, below PO Notes/Comments and above Line Items, that reads from and writes to FileMaker `Web_PO` fields and keeps the timeline in sync after each action — all gated behind order acknowledgement.

## Key Assumptions (please confirm at approval)
1. The acknowledgement dialog captures the **Est. Arrival Date**, which is saved to `EstArrivalDate` (the ticket text "update the ship date" is read as the estimated arrival/delivery date, not the shipped date).
2. `VendorAcknowledged` is treated as a boolean flag stored as `"1"` (acknowledged) / empty.
3. `VendorAcknowledgedBy` is the logged-in vendor's display name (`PersonFirstName` + `PersonLastName`), same source as T-023 comment author.
4. Send Invoice is a **stub** for the actual send — it validates (invoice no + ISF present + acknowledged), persists `VendorInvoiceNo`, and returns a success message; no email/document generation.
5. Field names are on the `Web_PO` layout exactly as listed; `Ready On` may be `ReadyOn` in FileMaker — both will be tried via `pickFieldValue`. (The shared screenshot showed the acknowledge fields under a "POD" layout; if any field is not found on `Web_PO`, this is the first thing to revisit.)
6. Date inputs use the native HTML date picker (`YYYY-MM-DD`) and are converted to FileMaker's `MM/DD/YYYY` on write; timestamps use the T-023 `M/D/YYYY h:mm:ss AM/PM` format.

## Proposed Approach

### 1. Extend the read model (`services/filemakerService.ts`)
- Add to `PurchaseOrderRecord` and `mapPurchaseOrderRecord` (via `pickFieldValue`/`normalizeFieldValue`):
  - `trackingNo` (`TrackingNo`), `vendorInvoiceNo` (`VendorInvoiceNo`), `orderShippedDate` (`OrderShippedDate`), `estArrivalDate` (`EstArrivalDate`), `vendorAcknowledged` (`VendorAcknowledged`), `vendorAcknowledgedBy` (`VendorAcknowledgedBy`), `vendorAcknowledgedOn` (`VendorAcknowledgedOn`), `orderPlacedOn` (`VendorPortalSyncOn`), `readyOn` (`Ready On` / `ReadyOn`).
- These automatically flow through `getPurchaseOrderDetails` → `GET /api/orders/details`.

### 2. Add write/service functions (`services/filemakerService.ts`)
- Add a small date helper `toFileMakerDate(isoDate)` → `MM/DD/YYYY`.
- Reuse `patchPurchaseOrderRecord` (T-023) and `getVendorPORecordByNumber` (T-023) for read-modify-write with the record's `recordId`.
- Reuse `getVendorCommentAuthorName` for the acknowledging user's name.
- New functions, each returning the freshly-mapped `PurchaseOrderRecord` so the client can update state:
  - `acknowledgeOrder(vendorId, poNumber, estArrivalDateIso)` — error if already acknowledged or date missing; PATCH `{ VendorAcknowledged: "1", VendorAcknowledgedBy, VendorAcknowledgedOn, EstArrivalDate }`.
  - `updateEstArrivalDate(vendorId, poNumber, estArrivalDateIso)` — require acknowledged; PATCH `{ EstArrivalDate }`.
  - `updateOrderShipped(vendorId, poNumber, shippedDateIso, trackingNo)` — require acknowledged + both inputs; PATCH `{ OrderShippedDate, TrackingNo }`.
  - `markOrderReady(vendorId, poNumber, readyDateIso)` — require acknowledged; PATCH `{ "Ready On": ... }`.
  - `sendVendorInvoice(vendorId, poNumber, invoiceNo)` — require acknowledged + invoice no; verify an ISF document exists via `getOrderDocumentsForVendor` (status !== "Not uploaded" for type "ISF Document"); persist `{ VendorInvoiceNo }`; return success (send stubbed).
- A shared guard helper `assertAcknowledged(record)` throwing a clear "Please acknowledge the order first." error keeps the gating consistent.

### 3. Add the actions API route (`app/api/orders/actions/route.ts`)
- Single `POST` handler with a discriminated `action` field: `acknowledge` | `update-est-delivery` | `update-shipped` | `mark-ready` | `send-invoice`.
- Validates `vendorId`, `poNumber`, and per-action payload; dispatches to the matching service function; returns `{ success: true, order }` (updated header) or `{ success: true, message }` for the invoice stub.
- Mirrors error handling from `app/api/orders/details/route.ts` (try/catch, `console.error`, sanitized messages, proper status codes). Gating errors return 409/400 with the "acknowledge first" message.
- (Chosen a single cohesive route over five separate files; can be split if preferred.)

### 4. Build the UI (`components/order-status-actions.tsx`, new client component)
- Props: the order header (new fields), `vendorId`, `poNumber`. Holds local copy of the relevant fields, updated from each action response so the timeline re-renders without a refetch (same pattern as T-023 comments).
- Layout: `grid gap-6 lg:grid-cols-2`, reusing the existing card styling; stacks on mobile.
- **Left — Order Status timeline:**
  - Rows: Order Placed (`orderPlacedOn`), Order Acknowledged (green + `vendorAcknowledgedBy`/`vendorAcknowledgedOn` when set, else "Pending"), Packed & Ready (`readyOn`/Pending), Order Shipped (`orderShippedDate`/Pending), Estimated Delivery (`estArrivalDate`/Pending).
  - Each row: icon, label, and right-aligned date or italic "Pending"; completed rows use a green check/accent.
- **Right — Vendor Actions panel:**
  - **Order Acknowledgement**: if not acknowledged, a button that opens a small in-component dialog/modal with an Est. Arrival Date input + Confirm (disabled until a date is chosen). If acknowledged, a static green "Order Acknowledged" badge.
  - **Send Invoice**: Invoice No input + Send button → posts `send-invoice`; on success shows an "Invoice sent" dialog; on validation failure shows the inline error (missing invoice no / missing ISF / not acknowledged).
  - **Est. Delivery Date**: date input + Update button — rendered only when acknowledged.
  - **Order Shipped Date**: Order Shipped Date input + Tracking No input + Update button — disabled with error until acknowledged.
  - **Packed & Ready**: date input + Update button — disabled with error until acknowledged.
  - Each action: disable its control while in flight, show inline success/error, and on success replace local field state from the returned header (timeline updates immediately).
- All pre-acknowledgement actions (except Acknowledge) show the "Please acknowledge the order first." error if attempted; the Est. Delivery control is hidden pre-acknowledgement.

### 5. Wire into the page (`app/dashboard/orders/[poNumber]/page.tsx`)
- Extend `OrderDetails["header"]` with the new fields.
- Render `<OrderStatusActions ... />` immediately **below** `<OrderNotesComments />` and **above** the Line Items `<section>`.

## Files Expected To Change
- `services/filemakerService.ts` (types, mapping, date helper, action functions)
- `app/api/orders/actions/route.ts` (new)
- `components/order-status-actions.tsx` (new)
- `app/dashboard/orders/[poNumber]/page.tsx` (type extension + render new component)

## Risks / Notes
- **Field-name verification.** The acknowledge fields appeared under a "POD" layout in the screenshot; the plan assumes they are accessible on `Web_PO`. If not, the mapping/PATCH layout for those specific fields will need adjustment (possible related-field syntax). `pickFieldValue` candidate lists keep this low-friction for reads; writes target `Web_PO` directly.
- **Date/timestamp formats.** FileMaker date/timestamp fields are format-sensitive; conversion helpers will produce `MM/DD/YYYY` and `M/D/YYYY h:mm:ss AM/PM`. If the FM file uses a different locale, the helper is the single place to adjust.
- **ISF validation cost.** `getOrderDocumentsForVendor` performs Drive lookups; Send Invoice will incur that latency once per click. Acceptable for a manual action; surfaced via the in-flight disabled state.
- **Read-modify-write.** Writes re-read the record immediately before patching (via `getVendorPORecordByNumber`) to minimize staleness; consistent with T-023.
- **Server-side authority.** Acknowledgement user, timestamps, and all gating are enforced server-side, not trusted from the client.
- No dependency/auth/env changes. Additive and scoped to the Order Details feature.

## Acceptance Criteria
- [ ] Status timeline renders (Order Placed, Acknowledged, Packed & Ready, Shipped, Est. Delivery) below PO Notes/Comments, above Line Items, populated from FileMaker.
- [ ] Vendor actions panel renders on the right following the existing theme.
- [ ] Acknowledgement requires an Est. Arrival Date dialog and writes `EstArrivalDate`, `VendorAcknowledged=1`, `VendorAcknowledgedBy`, `VendorAcknowledgedOn`.
- [ ] Acknowledged state shows green and appears in the timeline.
- [ ] Est. Delivery control hidden until acknowledged, then editable.
- [ ] Send Invoice validates invoice no + ISF presence; shows "Invoice sent" dialog when valid, error otherwise.
- [ ] Order Shipped update requires shipped date + tracking number; writes both.
- [ ] Packed & Ready writes `Ready On`.
- [ ] Non-acknowledgement actions blocked with an error until acknowledged.
- [ ] Timeline updates after each successful action without a full reload.
- [ ] Touched files pass TypeScript compilation and lint verification.
