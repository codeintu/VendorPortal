# Test Scenarios: TEST-022-remove-payments-tab

Status: OPEN
Ticket: T-022-remove-payments-tab

## Objective
Verify that the "Payments" tab is completely removed from the dashboard left-hand sidebar navigation list and that the remaining items navigation layout renders and compiles successfully.

## Proposed Strategy
Manual browser verification in the local app, backed by a targeted typecheck and lint check for the touched layout.

## Scenarios
- [ ] **Payments Tab is Completely Gone**
  - Open the vendor portal dashboard in the browser (`http://localhost:3000`).
  - Expected: The "Payments" tab is no longer visible in the left sidebar navigation list.
  
- [ ] **Remaining Tabs Function Correctly**
  - Verify that the Dashboard, Orders, and Profile tabs continue to display correctly in the sidebar.
  - Expected: Clicking Dashboard navigates to `/dashboard`, Clicking Orders navigates to `/dashboard/orders`, and Clicking Profile navigates to `/dashboard/profile`.
  
- [ ] **Clean TypeScript Compilation**
  - Run type checks (`npx tsc --noEmit`).
  - Expected: Compilation completes with no errors.
  
- [ ] **Clean Lint Verification**
  - Run lint validation (`npx eslint app/dashboard/layout.tsx`).
  - Expected: The layout file passes ESLint successfully.
