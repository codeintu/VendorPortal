# Test Scenarios: TEST-008-fetch-purchase-orders

Ticket: T-008-fetch-purchase-orders

## Objective
Verify that the Orders page can render live purchase-order data for the current hardcoded vendor ID without runtime crashes, including cases where some FileMaker fields are blank or missing.

## Proposed Strategy
Manual UI verification against the local app and live FileMaker-backed API flow, plus targeted lint verification for the touched files.

## Scenarios
- [x] **Orders Page Loads Live Records**
  - Open `http://localhost:3000/dashboard/orders`.
  - Expected: The page loads purchase orders for the current hardcoded vendor ID and exits the loading state cleanly.

- [x] **Missing Status Does Not Crash**
  - Verify at least one returned row with blank or missing `Status`, or simulate one through the service response during review.
  - Expected: The page does not crash, the row renders, and the badge displays a safe fallback label such as `Unknown`.

- [x] **Status Badge Colors Still Work**
  - Review rows with known values such as `Delivered`, `In Transit`, `Pending`, or `Delayed`.
  - Expected: Status badges retain the intended color variants in the Orders table.

- [x] **Blank Field Fallbacks Render Safely**
  - Review rows with blank dates, totals, or PO number fields if present.
  - Expected: The table renders safe placeholders instead of `undefined`, blank crashes, or broken layout.

- [x] **Error State Still Works**
  - Trigger an API failure condition or temporarily use an invalid query input during testing.
  - Expected: The Orders page shows the existing error state rather than stale rows or a runtime crash.

- [x] **Targeted Lint Verification**
  - Run `npx eslint services/filemakerService.ts app/api/orders/route.ts app/dashboard/orders/page.tsx`.
  - Expected: All targeted files pass lint successfully.

## Verification Result
All listed scenarios were completed successfully during review, and the targeted lint check passed for the touched files.
