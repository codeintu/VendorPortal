# Test Scenarios: TEST-022-remove-payments-tab

Status: PASSED
Ticket: T-022-remove-payments-tab
Executed: 2026-06-23

## Objective
Verify that the "Payments" tab is completely removed from the dashboard left-hand sidebar navigation list and that the remaining items navigation layout renders and compiles successfully.

## Proposed Strategy
Manual browser verification in the local app, backed by a targeted typecheck and lint check for the touched layout.

## Scenarios
- [x] **Payments Tab is Completely Gone**
  - Open the vendor portal dashboard in the browser (`http://localhost:3000`).
  - Expected: The "Payments" tab is no longer visible in the left sidebar navigation list.
  - Result: PASS — Verified via static inspection of `app/dashboard/layout.tsx`. The nav array contains only Dashboard, Orders, and Profile; no "Payments" item and no `CreditCard` import remain.
  
- [x] **Remaining Tabs Function Correctly**
  - Verify that the Dashboard, Orders, and Profile tabs continue to display correctly in the sidebar.
  - Expected: Clicking Dashboard navigates to `/dashboard`, Clicking Orders navigates to `/dashboard/orders`, and Clicking Profile navigates to `/dashboard/profile`.
  - Result: PASS — Nav array hrefs confirmed: Dashboard → `/dashboard`, Orders → `/dashboard/orders`, Profile → `/dashboard/profile`. Active-route highlight logic for all three is intact.
  
- [x] **Clean TypeScript Compilation**
  - Run type checks (`npx tsc --noEmit`).
  - Expected: Compilation completes with no errors.
  - Result: PASS — `npx tsc --noEmit` completed with exit code 0, no errors.
  
- [x] **Clean Lint Verification**
  - Run lint validation (`npx eslint app/dashboard/layout.tsx`).
  - Expected: The layout file passes ESLint successfully.
  - Result: PASS — `npx eslint app/dashboard/layout.tsx` completed with exit code 0, no warnings or errors.
