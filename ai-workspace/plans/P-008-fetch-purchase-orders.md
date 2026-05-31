# Implementation Plan: P-008-fetch-purchase-orders

Linked Ticket: T-008-fetch-purchase-orders

## Strategy
For this phase, we will keep the vendor ID hardcoded on purpose so we can stabilize the purchase-order retrieval flow and verify the FileMaker data mapping end to end.

The immediate goal is not to make vendor identity dynamic yet. The goal is to make the Orders page reliably render real FileMaker data for the hardcoded vendor without runtime crashes, even when some fields are blank or missing.

This means the implementation should focus on three layers working together safely:

1. FileMaker service response mapping
2. API response consistency
3. Frontend defensive rendering

Once that path is stable, a later ticket can replace the hardcoded vendor ID with session-based vendor identity.

## Key Problem Areas To Address

1. **Runtime crash from missing status**
   - `getStatusColor()` currently assumes `status` is always a string.
   - If FileMaker returns a record with missing or blank `Status`, the Orders page crashes before rendering fallback text.
2. **Unnormalized FileMaker fields**
   - The service currently maps raw `fieldData` directly into UI objects without fallback values.
   - Any missing field can create unstable client-side behavior.
3. **Hardcoded vendor ID should remain, but be treated as temporary**
   - The hardcoded vendor ID is acceptable for this phase, but the code should make that temporary assumption explicit and isolated.
4. **Verification needs to prove real records are rendering**
   - We need to confirm the target layout, query field, returned fields, and UI mapping all line up with actual FileMaker output.

## Data Mapping (FileMaker -> UI)

| UI Label | Internal Key | FileMaker Field |
| :--- | :--- | :--- |
| PO Number | `poNumber` | `PoNumber` |
| Date Entered | `dateEntered` | `DateEntered` |
| Est. Ship Date | `dateScheduled` | `DateScheduledArrival` |
| Date Received | `dateReceived` | `DateReceived` |
| Payment Date | `paymentDate` | `PaymentDate` |
| Total Amount | `totalAmount` | `Total_cn` |
| Status | `status` | `Status` |

## Implementation Steps

1. **Verify the Existing Query Path**
   - Confirm `FILEMAKER_LAYOUTS.purchaseOrders` points to the correct layout.
   - Confirm the filter field used in the `_find` query is the correct FileMaker field for vendor matching.
   - Confirm the hardcoded vendor ID being used actually returns records from `Web_POD`.

2. **Normalize FileMaker Response in the Service Layer**
   - Update `getVendorPOs()` so each returned record is transformed into a stable UI-safe object.
   - Provide explicit fallback values for each mapped field instead of passing `undefined` through to the client.
   - Ensure `status` is always a string, even if FileMaker returns blank or missing data.
   - Preserve the raw field mapping expected by the Orders table without adding unrelated transformations.

3. **Stabilize the API Response Shape**
   - Keep `/api/orders` returning a consistent `{ success, orders }` payload on success.
   - Ensure service errors still surface as API errors instead of partial malformed success payloads.
   - Avoid leaking raw FileMaker-specific structural noise into the frontend.

4. **Make the Orders Page Defensive**
   - Update `getStatusColor()` so it safely handles missing or unexpected values.
   - Ensure all rendered fields have safe fallbacks and do not depend on raw `undefined` values.
   - Keep the current hardcoded vendor ID for now, but isolate it clearly as a temporary placeholder for future dynamic integration.

5. **Confirm UI Column Alignment**
   - Keep the 7-column structure already intended for the live Orders view.
   - Verify the table labels and rendered values align with the mapped data fields.
   - Ensure empty values render gracefully rather than breaking spacing or typography.

6. **Add Focused Verification**
   - Verify the API returns real order rows for the hardcoded vendor ID.
   - Verify the Orders screen renders without runtime error when `status` is missing or blank.
   - Verify valid statuses still receive the correct badge colors.
   - Verify the empty-state and error-state UI still behave correctly.

## Files Expected To Change
- `services/filemakerService.ts`
- `app/api/orders/route.ts`
- `app/dashboard/orders/page.tsx`

## Potential Risks
- The actual FileMaker status field may not be consistently populated across records.
- Some FileMaker field names may differ in casing or content from what the UI currently expects.
- A hardcoded vendor ID may appear to “work” while still hiding later session-integration issues, so this phase should stay narrowly focused on data stability.

## Acceptance Criteria
- [ ] The Orders page renders real purchase order data for the current hardcoded vendor ID.
- [ ] The Orders page no longer crashes if a purchase order has a missing or blank status.
- [ ] The service returns normalized order objects so the frontend does not receive unstable `undefined` field values.
- [ ] The Orders API returns a consistent success/error shape for the frontend.
- [ ] The 7-column orders table renders correctly with real data and safe fallbacks.
- [ ] The modified files pass targeted verification after implementation.

## Verification Plan

### Manual Verification
1. Open the Orders page and confirm live purchase orders load for the current hardcoded vendor ID.
2. Inspect at least one returned record to confirm the mapped field names match the expected FileMaker layout fields.
3. Confirm rows with blank date or status values render fallback text instead of crashing.
4. Confirm valid statuses such as `Delivered`, `In Transit`, `Pending`, and `Delayed` still render distinct badge styles.
5. Confirm the page shows the existing empty-state UI when no records are found.
6. Confirm the page shows the existing error-state UI when the API request fails.

### Targeted Verification
1. Run a targeted lint check on:
   - `services/filemakerService.ts`
   - `app/api/orders/route.ts`
   - `app/dashboard/orders/page.tsx`
