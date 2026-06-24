# Implementation Plan: P-023-order-notes-vendor-comments

Linked Ticket: T-023-order-notes-vendor-comments

## Objective
Add a side-by-side "PO Notes" (read-only) and "Vendor Comments" (read + append) block to the Order Details screen, directly above the Line Items section, wired to the FileMaker `Web_PO` fields `Message` and `VendorNotes`, with new comments stamped by the logged-in vendor's name and a timestamp.

## Proposed Approach

### 1. Surface the two fields on the read path
- In `services/filemakerService.ts`:
  - Extend `PurchaseOrderRecord` type with `notes: string` (from `Message`) and `vendorComments: string` (from `VendorNotes`).
  - Update `mapPurchaseOrderRecord` to populate them via `pickFieldValue`/`normalizeFieldValue`.
  - Preserve existing behavior for all other fields (no field renames).
- In `app/dashboard/orders/[poNumber]/page.tsx`, extend the `OrderDetails["header"]` type with `notes` and `vendorComments` so the values are available to the new UI.

### 2. Add a FileMaker write path (new — none exists today)
- In `services/filemakerService.ts`, add:
  - `getVendorPORecordByNumber(vendorId, poNumber)` — like `getVendorPOByNumber` but also returns the FileMaker `recordId` (currently the `recordId` from the `_find` response is discarded). Used to target the PATCH.
  - `updatePurchaseOrderVendorNotes(recordId, vendorNotes)` — performs an authenticated `PATCH` to `/layouts/Web_PO/records/{recordId}` with `{ fieldData: { VendorNotes: <value> } }`, including the same 401-refresh-and-retry behavior used elsewhere. (The existing `fetchFM` helper is hardcoded to the `/_find` endpoint, so this needs a dedicated record-PATCH call, mirroring the pattern already used by `getVendorDetails` for record GETs.)
  - `getVendorCommentAuthorName(vendorId)` — resolves `PersonFirstName` + `PersonLastName` from the `Web_Contacts` (vendors) layout for display in the comment stamp; falls back gracefully if either part is blank.
- Add an `appendVendorComment(vendorId, poNumber, commentText)` service function that:
  1. Loads the PO record (+ recordId) and validates it belongs to the vendor.
  2. Resolves the author name.
  3. Builds the new entry server-side: `"{commentText}\n - {AuthorName} {timestamp}"`, where timestamp matches the existing US format (`M/D/YYYY h:mm:ss AM/PM`).
  4. Appends it to the existing `VendorNotes` value (existing content preserved, new entry separated by a newline).
  5. PATCHes the record and returns the updated `VendorNotes` string.

### 3. Add the comment API route
- New route `app/api/orders/comments/route.ts` with a `POST` handler:
  - Accept JSON `{ vendorId, poNumber, comment }`.
  - Validate all three are present and `comment` is non-empty after trim; return 400 otherwise.
  - Call `appendVendorComment(...)`, return `{ success: true, vendorComments }` on success.
  - Mirror the existing error-handling shape used by `app/api/orders/details/route.ts` (try/catch, `console.error`, sanitized message, proper status codes).
- Author/timestamp are generated server-side (authoritative), not trusted from the client.

### 4. Build the UI block
- Add a new client component `components/order-notes-comments.tsx` (keeps the page file lean and follows the `order-documents-panel.tsx` precedent), accepting `notes`, `initialComments`, `vendorId`, and `poNumber` props. It will:
  - Render a responsive two-column grid (`grid gap-6 lg:grid-cols-2`) — PO Notes on the left, Vendor Comments on the right; stacked on mobile.
  - Reuse the existing card styling (`rounded-[…] border border-border/70 bg-card …`) and the `SectionTitle`/header pattern already used on the page for visual consistency.
  - **PO Notes (left):** read-only, preserve line breaks (`whitespace-pre-wrap`); show a muted placeholder when empty.
  - **Vendor Comments (right):** a read-only scrollable text area showing the current `VendorNotes` (preserving line breaks so the name/timestamp lines render as in the legacy portal), plus an `Enter your comment` input and a `Post` button.
  - On Post: disable the button, POST to `/api/orders/comments`, on success replace the displayed comments with the returned value and clear the input; on failure show an inline error and keep the typed text.
- In `app/dashboard/orders/[poNumber]/page.tsx`, render `<OrderNotesComments .../>` immediately before the Line Items `<section>`, passing `order.header.notes`, `order.header.vendorComments`, `vendorId`, and `poNumber`.

## Files Expected To Change
- `services/filemakerService.ts` (type + mapping + new read/write helpers)
- `app/dashboard/orders/[poNumber]/page.tsx` (type extension + render new component)
- `components/order-notes-comments.tsx` (new component)
- `app/api/orders/comments/route.ts` (new route)

## Risks / Notes
- **First FileMaker write in the codebase.** Updating `VendorNotes` requires a record `recordId` and a PATCH to the `/records/{id}` endpoint, which `fetchFM` (find-only) does not cover. The new PATCH helper will follow the existing token-refresh-on-401 pattern.
- **Append vs. overwrite race.** Comments are appended to a single text field. If two posts happen near-simultaneously the read-modify-write could drop one; acceptable for current low-concurrency single-vendor usage and matches legacy behavior. Will read the freshest value immediately before appending.
- **Exact field names.** Plan assumes the PO Notes field is `Message` and comments field is `VendorNotes` on `Web_PO`, and author fields are `PersonFirstName`/`PersonLastName` on `Web_Contacts`, per the ticket. If FileMaker uses different casing/related-field names, `pickFieldValue` candidate lists will be adjusted during implementation (no schema change).
- **Timestamp source.** Generated on the server at post time to keep it authoritative and consistent; format matched to the legacy `M/D/YYYY h:mm:ss AM/PM` style.
- No dependency, auth, or env changes. Changes are additive and scoped to the Order Details feature.

## Acceptance Criteria
- [ ] PO Notes (`Message`) renders read-only above Line Items.
- [ ] Vendor Comments (`VendorNotes`) renders above Line Items, right of PO Notes, side by side on desktop and stacked on mobile.
- [ ] Posting a comment appends it to `VendorNotes` in FileMaker with author name + timestamp below the message.
- [ ] The new comment appears in the panel without a full reload and the input clears.
- [ ] Empty/whitespace comments are rejected; failures show an error without losing typed text.
- [ ] Panels follow the existing card theme/format.
- [ ] Touched files pass TypeScript compilation and lint verification.
