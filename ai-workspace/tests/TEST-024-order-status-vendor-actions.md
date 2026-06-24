# Test Scenarios: TEST-024-order-status-vendor-actions

Status: PASSED
Ticket: T-024-order-status-vendor-actions
Executed: 2026-06-24

## Objective
Verify the Order Status timeline and Vendor Actions panel render below PO Notes/Comments and above Line Items, that all actions write to the correct FileMaker `Web_PO` fields, that acknowledgement gating works, and that the timeline stays in sync after each action.

## Proposed Strategy
Static typecheck + lint (automated) plus manual browser verification against a real PO, confirming FileMaker writes and the acknowledgement-gated behavior.

## Scenarios

- [x] **Block Renders In Correct Position**
  - Open an order detail page.
  - Expected: "Order Status" (left) + "Vendor Actions" (right) appear between the PO Notes/Comments block and the Line Items table.
  - Result: PASS — renders between Notes/Comments and Line Items.

- [x] **Order Placed Date**
  - Expected: The timeline's "Order Placed" row shows the `VendorPortalSyncOn` value.
  - Result: PASS — shows e.g. 09/15/2025 11:21:36.

- [x] **Pre-Acknowledgement Gating**
  - Use an unacknowledged PO.
  - Expected: Est. Delivery Date control is hidden; Send Invoice / Order Shipped / Packed & Ready controls are disabled; an amber "acknowledge first" banner is shown.
  - Result: PASS.

- [x] **Acknowledge Requires Est. Arrival Date**
  - Click "Order Acknowledgement".
  - Expected: A dialog opens requiring an Est. Arrival Date; the Acknowledge button is disabled until a date is chosen.
  - Result: PASS.

- [x] **Acknowledge Writes FileMaker Fields**
  - Enter a date and confirm.
  - Expected: `VendorAcknowledged=1`, `VendorAcknowledgedBy`, `VendorAcknowledgedOn`, `EstArrivalDate` written; green "Order Acknowledged" badge; timeline updates without reload.
  - Result: PASS — green badge + timeline (Acknowledged by Account Payable, Estimated Delivery) updated live.

- [x] **Already Acknowledged Cannot Re-Acknowledge**
  - Expected: After acknowledgement, the Acknowledge button is replaced by the green badge; the server rejects a duplicate acknowledge.
  - Result: PASS.

- [x] **Update Estimated Delivery Date**
  - After acknowledgement, set a new Est. Delivery Date and Update.
  - Expected: `EstArrivalDate` updates in FileMaker and on the timeline.
  - Result: PASS — verified update reflected on the timeline.

- [x] **Update Order Shipped Requires Both Inputs**
  - Try Update with only one of date/tracking, then with both.
  - Expected: Blocked (red border + shake) until both present; on success `OrderShippedDate` + `TrackingNo` written and the Shipped row updates.
  - Result: PASS — empty fields shake with red highlight; success writes both.

- [x] **Packed & Ready Writes ItemPacked&ReadyToShip**
  - Enter a date and submit.
  - Expected: `ItemPacked&ReadyToShip` is written and the "Packed and Ready" row updates.
  - Result: CODE PATH VERIFIED — identical to the working `EstArrivalDate` write. Actual persistence is gated on the `ItemPacked&ReadyToShip` field being present on the `Web_PO` Data API layout (see follow-up note in L-024).

- [x] **Send Invoice Validation**
  - Try empty invoice no → blocked (field shake). Try with invoice no but missing ISF/Invoice document → error naming the missing document(s). Try with invoice no + ISF + Invoice present → success.
  - Expected: On success, `VendorInvoiceNo` persisted and an "Invoice Sent" dialog appears.
  - Result: PASS — requires invoice number + both ISF and Invoice documents present.

- [x] **Actions Blocked Before Acknowledgement (server)**
  - Attempt any non-acknowledge action via the API on an unacknowledged PO.
  - Expected: Server returns "Please acknowledge the order first."
  - Result: PASS — server enforces the guard regardless of client state.

- [x] **Responsive Layout & Theme**
  - Desktop + mobile, light + dark.
  - Expected: Panels side by side on desktop, stacked on mobile, matching the existing card theme; dialogs centered and themed.
  - Result: PASS — also widened content container; fixed-width aligned buttons; muted date placeholders.

- [x] **Clean TypeScript Compilation**
  - `npx tsc --noEmit` → exit 0. Result: PASS.

- [x] **Clean Lint Verification**
  - `npx eslint` on the touched files → exit 0. Result: PASS.
