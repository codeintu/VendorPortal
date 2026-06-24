# Ticket: T-023-order-notes-vendor-comments

Status: COMPLETED
Created: 2026-06-23
Completed: 2026-06-23
Author: AI Agent

## Problem Statement
The Order Details screen (`/dashboard/orders/[poNumber]`) currently shows the summary cards and the Line Items table, but it does not surface two pieces of information that already exist on the FileMaker PO record:

1. **PO Notes** — buyer/internal instructions stored in the `Message` field on the `Web_PO` (purchaseOrders) layout (e.g. "COA must be provided along with the ISF", "Please telex release after payment received"). Vendors have no way to read these in the portal today.
2. **Vendor Comments** — a running log of vendor remarks stored in the `VendorNotes` field on `Web_PO`. Each entry shows the comment text followed by the author name and a timestamp (e.g. `delay in delivery\n - Account Payable 6/19/2026 4:22:35 PM`). Vendors cannot read existing comments or add new ones from the portal.

The legacy PHP vendor portal exposes both of these side by side; the new Next.js portal should match that capability.

## Goal
Add two panels to the Order Details screen, placed **side by side and directly above the Line Items section**, matching the existing card theme/format:

- **Left — PO Notes**: read-only display of the `Message` field for the PO.
- **Right — Vendor Comments**: read existing `VendorNotes`, plus an input + "Post" button so the vendor can add a new comment. New comments are appended to `VendorNotes` in FileMaker and immediately reflected on the page, each stamped with the author name and timestamp.

## Scope
1. **Backend — read path**
   - Map the `Message` field (PO Notes) and the `VendorNotes` field (Vendor Comments) in `mapPurchaseOrderRecord` so they flow through the existing `GET /api/orders/details` response.
   - Capture the FileMaker internal `recordId` for the PO so it can be targeted for updates.
2. **Backend — write path**
   - Add a FileMaker helper to fetch a PO record (with its `recordId`) and a helper to PATCH (update) the `VendorNotes` field. (No write path to FileMaker exists today — `fetchFM` is `_find`-only.)
   - Resolve the commenting vendor's display name from `PersonFirstName` + `PersonLastName` on the `Web_Contacts` (vendors) layout.
   - Add a new API route to accept a new comment, append it to `VendorNotes` (server-side timestamp + author name), persist it, and return the updated comments value.
3. **Frontend**
   - Add a `PO Notes` + `Vendor Comments` UI block to the Order Details page, rendered above Line Items, in a responsive two-column layout (stacked on small screens) that reuses the existing card styling.
   - Render existing comments, provide the comment input + Post action, show pending/error states, and refresh the displayed comments after a successful post.

## Out of Scope
- Editing or deleting existing comments (append-only, matching legacy behavior).
- Editing the PO Notes (`Message`) field from the portal — it is read-only here.
- Any change to Line Items, document upload/Drive sync, summary cards, dashboard, or other screens.
- Changing authentication, environment configuration, or `package.json` dependencies.

## Acceptance Criteria
- [x] PO Notes panel renders the `Message` field content (read-only) above the Line Items section.
- [x] Vendor Comments panel renders existing `VendorNotes` content above the Line Items section, to the right of PO Notes.
- [x] Both panels sit side by side on desktop and stack cleanly on mobile, following the existing card theme/format.
- [x] A vendor can type a comment and click Post; the new comment is appended to `VendorNotes` in FileMaker.
- [x] Each posted comment shows the author name (PersonFirstName + PersonLastName) and a timestamp below the message, matching the existing format.
- [x] After a successful post the new comment appears in the panel without a full page reload, and the input clears.
- [x] Empty/whitespace-only comments are rejected; post failures show a clear error and do not lose the typed text.
- [x] Touched files pass TypeScript compilation and lint verification.
