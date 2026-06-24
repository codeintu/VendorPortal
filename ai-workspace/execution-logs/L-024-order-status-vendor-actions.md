# Execution Log: L-024-order-status-vendor-actions

Status: COMPLETE
Ticket: T-024-order-status-vendor-actions
Date: 2026-06-24

## Summary
Added an "Order Status" timeline (left) and a "Vendor Actions" panel (right) to the Order Details screen, below the PO Notes/Comments block and above Line Items. The actions read from and write to FileMaker `Web_PO` fields and keep the timeline in sync after each action. All non-acknowledgement actions are gated behind order acknowledgement.

## Steps Performed
1. **Read model** — extended the PO mapping with the status/action fields.
2. **Write/service layer** — added a date helper, an acknowledgement guard, and five action functions reusing the T-023 PATCH + record-fetch helpers.
3. **API** — added a single consolidated actions route with a discriminated `action` field.
4. **UI** — built the status timeline + actions panel component (with acknowledgement dialog and invoice-sent dialog) and wired it into the page.
5. **Verification** — ran typecheck and lint on all touched files.

## Files Modified
- `services/filemakerService.ts`
  - Added 9 fields to `PurchaseOrderRecord` + `mapPurchaseOrderRecord`: `trackingNo` (`TrackingNo`), `vendorInvoiceNo` (`VendorInvoiceNo`), `orderShippedDate` (`OrderShippedDate`), `estArrivalDate` (`EstArrivalDate`), `vendorAcknowledged` (`VendorAcknowledged`), `vendorAcknowledgedBy` (`VendorAcknowledgedBy`), `vendorAcknowledgedOn` (`VendorAcknowledgedOn`), `orderPlacedOn` (`VendorPortalSyncOn`), `readyOn` (`ReadyOn` / `Ready On`).
  - Added `toFileMakerDate` (ISO `YYYY-MM-DD` → `M/D/YYYY`), `isAcknowledged`, `assertAcknowledged`, and a private `updatePurchaseOrder` (read record → guard → PATCH → re-read) helper.
  - Added action functions: `acknowledgeOrder`, `updateEstArrivalDate`, `updateOrderShipped`, `markOrderReady`, `updateVendorInvoiceNo` — each returns the refreshed `PurchaseOrderRecord`.
- `app/api/orders/actions/route.ts` (new)
  - `POST` with `action` switch: `acknowledge`, `update-est-delivery`, `update-shipped`, `mark-ready`, `send-invoice`.
  - `send-invoice` gates on acknowledgement, then validates an ISF document exists (via `getOrderDocumentsForVendor`), persists `VendorInvoiceNo`, and returns an "Invoice sent" message (actual send stubbed).
- `components/order-status-actions.tsx` (new)
  - Left: status timeline (Order Placed, Acknowledged [green], Packed & Ready, Shipped, Estimated Delivery).
  - Right: Order Acknowledgement button → dialog requiring Est. Arrival Date; Send Invoice (invoice no + ISF validation); Est. Delivery Date (shown only after acknowledgement); Order Shipped Date + Tracking; Packed & Ready.
  - Gating: pre-acknowledgement, the Est. Delivery control is hidden and the other actions are disabled with an amber "acknowledge first" banner; server enforces the same.
  - Each successful action updates local status from the returned record → timeline refreshes without a page reload.
- `app/dashboard/orders/[poNumber]/page.tsx`
  - Extended `OrderDetails["header"]` with the 9 new fields; rendered `<OrderStatusActions />` between `<OrderNotesComments />` and the Line Items section.

## Notes / Decisions
- **No circular import**: ISF validation lives in the API route (which imports both services), keeping `filemakerService` free of an `orderDocumentsService` import.
- **Server authority**: acknowledgement user, timestamp, gating, and ISF validation are all enforced server-side.
- **Read-modify-write**: each action re-reads the record immediately before patching (consistent with T-023), and re-reads after patching to return authoritative values.
- **Assumptions implemented** (per approved plan): acknowledge dialog saves Est. Arrival Date to `EstArrivalDate`; `VendorAcknowledged` stored as `"1"`; `VendorInvoiceNo` persisted on Send Invoice; fields targeted on `Web_PO` (`ReadyOn` primary, `Ready On` fallback on read).

## Post-Review Refinements (developer feedback)
- **Layout width**: widened the shared dashboard content container `max-w-[1180px]` → `max-w-[1300px]` in `app/dashboard/layout.tsx` to reduce side whitespace (global; affects all dashboard pages).
- **Status timeline fill**: the timeline list now uses `flex-1 justify-between` with vertically centered rows so it fills the full card height instead of leaving a bottom gap.
- **Actions panel polish**: fixed-width action buttons so they align; "Send Invoice" no longer wraps; added a "Tracking No" label; relabeled the packed button to "Update" and the shipped button to "Order Shipped".
- **Date placeholder color**: native date inputs render their mm/dd/yyyy hint via text color (no real placeholder) — now muted when empty, foreground when filled, matching the text placeholders.
- **Pre-fill from stored values**: Invoice No, Est. Delivery, Order Shipped + Tracking, and Packed & Ready inputs are seeded from the stored FileMaker values (FM `M/D/YYYY` converted to the `YYYY-MM-DD` the date input needs).
- **Validation feedback**: removed inline error text; required-field/failed actions now show a visible red border (`border-red-500` + ring) plus a one-shot `shake` animation (added to `app/globals.css`). Border clears on edit.
- **Reordered right panel**: Invoice → Estimated Delivery → Packed & Ready → Order Shipped.
- **Packed & Ready field**: switched from `ReadyOn` to the FileMaker field `ItemPacked&ReadyToShip` for both read and write.
- **Send Invoice validation**: now requires the invoice number **plus both** an ISF document and an Invoice document present in the order's document section.

## Additional Files Modified
- `app/dashboard/layout.tsx` — content container max-width (global refinement).
- `app/globals.css` — `shake` keyframe + `.animate-shake` utility for validation feedback.

## Known Follow-up (FileMaker-side, not a code defect)
- Writing/reading the Packed & Ready date depends on `ItemPacked&ReadyToShip` being present on the `Web_PO` layout used by the Data API. If that field is not on the layout (read returns empty, write fails), it must be added in FileMaker — the code path is identical to the working `EstArrivalDate` write. Pending confirmation of the exact FileMaker error / field placement.

## Verification
- `npx tsc --noEmit` → exit 0, no errors.
- `npx eslint` on all touched code files → exit 0, clean.
- Manual browser verification by developer: status timeline + actions panel render and function (acknowledge, est. delivery, order shipped, send-invoice validation), layout/spacing, validation shake, and date pre-fill confirmed. Packed & Ready persistence is gated on the FileMaker field placement noted above.
