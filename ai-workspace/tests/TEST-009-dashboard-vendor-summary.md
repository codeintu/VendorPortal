# Test Scenarios: TEST-009-dashboard-vendor-summary

Ticket: T-009-dashboard-vendor-summary

## Objective
Verify that the dashboard loads vendor-specific company details, order counts, and the five most recent orders after login, while handling missing fields safely.

## Proposed Strategy
Manual end-to-end verification in the local app, backed by targeted lint verification for the touched files.

## Scenarios
- [x] **Vendor ID Persists After Login**
  - Sign in through the login page.
  - Expected: The app stores the vendor ID in browser storage and redirects to the dashboard.

- [x] **Dashboard Loads Vendor Summary**
  - Open `http://localhost:3000/dashboard` after login.
  - Expected: The dashboard fetches the vendor summary and renders company details, counts, and recent orders.

- [x] **Company Profile Renders Safely**
  - Inspect the company name, address, tax ID, and primary contact sections.
  - Expected: Real vendor data appears when available, and missing fields fall back safely without crashing.

- [x] **Count Cards Reflect Live Data**
  - Check the Active Orders, Pending Invoices, and Closed Orders cards.
  - Expected: The values reflect the vendor summary returned by the server.

- [x] **Five Recent Orders Render**
  - Inspect the recent orders table on the dashboard.
  - Expected: Up to five recent vendor orders appear with safe fallback labels for missing values.

- [x] **Missing Data Does Not Crash**
  - Simulate or review a vendor response with blank company fields, blank order fields, or blank status values.
  - Expected: The dashboard continues rendering with placeholders instead of runtime errors.

- [x] **Targeted Lint Verification**
  - Run `npx eslint app/api/auth/login/route.ts app/api/dashboard/summary/route.ts app/login/page.tsx app/dashboard/page.tsx services/filemakerService.ts`.
  - Expected: All targeted files pass lint successfully.

## Verification Result
All listed scenarios were completed successfully during review, and the targeted lint verification passed.
