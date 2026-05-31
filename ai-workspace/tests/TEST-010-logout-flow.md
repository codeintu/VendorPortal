# Test Scenarios: TEST-010-logout-flow

Status: COMPLETE
Ticket: T-010-logout-flow

## Objective
Verify that the Logout action clears client-side vendor state and returns the user to the login page safely.

## Proposed Strategy
Manual browser verification in the local app, backed by a targeted lint check for the touched dashboard shell.

## Scenarios
- [x] **Logout Clears Vendor Storage**
  - Sign in and confirm `vendorId` and `vendorName` exist in browser storage.
  - Click Logout.
  - Expected: The stored vendor values are removed from browser storage.

- [x] **Logout Redirects to Login**
  - Click Logout from the dashboard shell.
  - Expected: The app navigates to `/login`.

- [x] **Logout Works From Shared Shell**
  - Open both `/dashboard` and `/dashboard/orders`, then use Logout from each route.
  - Expected: The same logout behavior works from either page.

- [x] **Logout Is Safe With Empty Storage**
  - Remove the vendor keys manually, then click Logout.
  - Expected: The app does not crash and still redirects to `/login`.

- [x] **Targeted Lint Verification**
  - Run `npx eslint app/dashboard/layout.tsx`.
  - Expected: The dashboard layout passes lint successfully.
