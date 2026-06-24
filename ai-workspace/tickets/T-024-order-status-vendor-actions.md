# Ticket: T-024-order-status-vendor-actions

Status: COMPLETED
Created: 2026-06-23
Completed: 2026-06-24
Author: AI Agent

## Problem Statement
The Order Details screen shows order info, PO Notes/Comments, and Line Items, but the vendor cannot drive the order lifecycle from the portal the way the legacy PHP portal allows. The legacy portal shows a left-hand **status timeline** ("Vendor Action Items") and a right-hand **action panel** (Order Acknowledgement, Send Invoice, Est. Delivery Date, Order Shipped Date, Packed & Ready) that write back to FileMaker.

The new portal needs the same capability so vendors can acknowledge orders, record shipping/invoice details, and keep the status timeline in sync.

## Goal
Add a two-panel block **below the PO Notes / Vendor Comments section and above Line Items**:
- **Left — Order Status timeline** ("Vendor Action Items"): Order Placed, Order Acknowledged, Packed & Ready, Order Shipped, Estimated Delivery — each showing its date or a "Pending" state, sourced from FileMaker.
- **Right — Vendor Actions panel**: buttons + input fields that update FileMaker PO fields, gated behind order acknowledgement.

When any action updates a field, the left status timeline updates so the vendor stays in sync.

## FileMaker Fields (Web_PO layout)
Read + write:
- `TrackingNo` — shipment tracking number
- `VendorInvoiceNo` — vendor invoice number
- `OrderShippedDate` — date order shipped
- `EstArrivalDate` — estimated arrival / delivery date
- `VendorAcknowledged` — acknowledgement flag (set to `1`)
- `VendorAcknowledgedBy` — logged-in vendor name
- `VendorAcknowledgedOn` — acknowledgement timestamp
- `ReadyOn` — packed & ready date
Read only:
- `VendorPortalSyncOn` — used as the "Order Placed" date

## Scope

### Status timeline (left)
1. Order Placed — `VendorPortalSyncOn`.
2. Order Acknowledged  — shown with `VendorAcknowledgedOn` when `VendorAcknowledged = 1`, otherwise "Pending". Rendered in green once acknowledged.
3. Packed and Ready — `ReadyOn` or "Pending".
4. Order Shipped — `OrderShippedDate` or "Pending".
5. Estimated Delivery — `EstArrivalDate` or "Pending".

### Vendor Actions panel (right)
1. **Order Acknowledgement** button: opens a dialog requiring an **Est. Arrival Date**. The order can only be acknowledged after that date is entered. On save: set `EstArrivalDate`, `VendorAcknowledged = 1`, `VendorAcknowledgedBy` = logged-in vendor name, `VendorAcknowledgedOn` = timestamp. After acknowledgement the button shows a green "Order Acknowledged" state.
2. **Invoice No field + Send Invoice** button: validate that the invoice number is entered AND an ISF document exists in the order's document section. If valid, show an "Invoice sent" confirmation dialog (actual sending is stubbed for now). Persist `VendorInvoiceNo`.
3. **Est. Delivery Date field + Update** button: update `EstArrivalDate`. Hidden until the order is acknowledged.
4. **Order Shipped Date field + Tracking No field + Update** button: require both shipped date and tracking number, then update `OrderShippedDate` and `TrackingNo`.
5. **Packed & Ready** button: capture a packed date and update `Ready On`.

### Gating rules
- Until the order is acknowledged, the Est. Delivery Date control is **not shown**.
- Until the order is acknowledged, all other actions (Send Invoice, Order Shipped, Packed & Ready, Est. Delivery update) are **blocked** with a clear "Please acknowledge the order first" error.
- An order already acknowledged cannot be re-acknowledged.

### Backend
- Extend the PO mapping to return the new fields through the order details API.
- Reuse the existing FileMaker PATCH helper (added in T-023) for all writes.
- Resolve the acknowledging user's name from the vendors layout (reuse T-023 author lookup).
- Validate ISF presence for Send Invoice via the existing order-documents service.
- Add API route(s) for the actions, mirroring existing route conventions.

## Out of Scope
- Actually sending/emailing the invoice or generating invoice documents (stubbed — confirmation dialog only).
- The "Specification Sheets", "Upload Documents" jump, and per-line-item note icons shown in the legacy screenshot (handled by existing document features / not requested).
- Editing acknowledged-by/timestamp manually, or un-acknowledging an order.
- Changes to authentication, environment, or `package.json` dependencies.

## Acceptance Criteria
- [x] A status timeline (Order Placed, Acknowledged, Packed & Ready, Shipped, Est. Delivery) renders on the left, below PO Notes/Comments and above Line Items, populated from FileMaker.
- [x] A vendor actions panel renders on the right with the buttons/fields described above, following the existing card theme.
- [x] Order Acknowledgement requires an Est. Arrival Date via a dialog; on save it sets `EstArrivalDate`, `VendorAcknowledged=1`, `VendorAcknowledgedBy`, and `VendorAcknowledgedOn`.
- [x] After acknowledgement, the portal shows a green "Order Acknowledged" indicator and the acknowledged entry appears in the timeline.
- [x] Est. Delivery Date control is hidden until acknowledged, then editable.
- [x] Send Invoice validates invoice number + ISF document presence (and Invoice document presence); shows an "Invoice sent" dialog when valid and an error otherwise.
- [x] Order Shipped update requires shipped date + tracking number and writes both fields.
- [x] Packed & Ready captures a date and writes `ItemPacked&ReadyToShip` (was `Ready On`; field-on-layout follow-up noted in L-024).
- [x] All non-acknowledgement actions are blocked with an error until the order is acknowledged.
- [x] After any successful update, the left status timeline reflects the new values without a full page reload.
- [x] Touched files pass TypeScript compilation and lint verification.
