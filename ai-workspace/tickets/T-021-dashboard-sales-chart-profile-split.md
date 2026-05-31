# Ticket: T-021-dashboard-sales-chart-profile-split

Status: IN PROGRESS
Created: 2026-05-31
Author: AI Agent

## Problem Statement
The dashboard currently loads and renders vendor company profile details directly on the main dashboard. This makes the dashboard less focused and means vendor profile data is fetched even when the user only needs order and sales activity.

## Goal
Move vendor company details into the Profile section and replace the dashboard profile card with a sales overview line chart that helps vendors understand their monthly and yearly sales activity.

## Scope
1. Create a working Profile page for vendor/company details.
2. Fetch vendor profile details only when the Profile page is opened.
3. Remove the Company Profile card from the dashboard.
4. Add a dashboard sales line chart with Monthly and Yearly views.
5. Derive sales chart totals from vendor purchase orders.
6. Keep dashboard summary focused on counts, recent orders, and sales chart data.

## Requirements
- Profile page should show company name, vendor ID, business address, primary contact, email, and phone.
- Dashboard should not require full vendor profile data to render.
- Sales chart should support Monthly and Yearly toggle options.
- Sales chart should gracefully handle empty or zero sales data.
- Dashboard should keep the current summary cards and Recent Orders table.
- Use a maintainable chart package instead of hand-building all chart interactions.

## Proposed Approach
1. Add `recharts` for the dashboard line chart.
2. Update dashboard summary data to include grouped sales data and exclude vendor profile details.
3. Add a dedicated vendor profile API route using existing FileMaker vendor lookup logic.
4. Create `/dashboard/profile` and wire the sidebar Profile tab to it.
5. Replace the dashboard Company Profile card with a responsive Sales Overview chart.
6. Verify lint and type checks for touched files.

## Acceptance Criteria
- [x] Profile tab navigates to a real Profile page.
- [x] Vendor profile details are displayed on the Profile page.
- [x] Dashboard no longer renders the Company Profile card.
- [x] Dashboard shows a sales line chart.
- [x] User can toggle chart between Monthly and Yearly.
- [x] Dashboard summary no longer fetches vendor details.
- [x] Touched files pass lint verification.

## Notes
- Initial implementation will treat sales as the sum of PO total amounts grouped by order date. If a received date exists, it can be preferred for completed activity; otherwise date entered is used as a fallback.
