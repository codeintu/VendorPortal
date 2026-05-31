# Implementation Plan: P-009-dashboard-vendor-summary

Linked Ticket: T-009-dashboard-vendor-summary

## Strategy
We will keep the current dashboard shell and page structure, but replace the hardcoded dashboard content with data loaded for the authenticated vendor.

The dashboard needs to become a summary view rather than a mock landing page. That means the implementation should focus on three data groups:

1. Vendor company profile data
2. Vendor account counts
3. Vendor's five most recent purchase orders

The most important part of this ticket is data shaping and safe rendering. The visual layout already exists, so we should preserve the current design language and only swap the underlying content.

## Implementation Steps

1. **Confirm Data Sources**
   - Identify the API/service path for vendor profile details.
   - Identify the API/service path for order counts and recent orders.
   - Confirm what vendor identity value is available to the dashboard right now.
2. **Define Dashboard Data Shape**
   - Decide on one normalized object for the dashboard summary.
   - Include company details, counts, and recent order rows in a predictable structure.
   - Add fallback values so missing fields do not break the UI.
3. **Load Vendor Data in the Dashboard**
   - Fetch the vendor summary on dashboard render or mount.
   - Keep the dashboard in a loading state until the data is ready.
   - Handle API errors with a graceful dashboard-level error state.
4. **Replace Static Company Profile Content**
   - Swap the static company name, address, tax ID, and contact data for live vendor values.
   - Keep the existing visual block layout.
5. **Replace Static Metric Card Values**
   - Fill Active Orders, Pending Invoices, and Closed Orders from live counts.
   - Keep the current card styling and only update the values/details.
6. **Replace the Recent Orders Table Content**
   - Show the five most recent vendor orders in the dashboard table.
   - Keep the table structure aligned with the current dark dashboard design.
   - Add safe fallbacks for missing date, amount, or status fields.
7. **Guard Against Incomplete Data**
   - Ensure the page does not crash if a field is missing or blank.
   - Preserve the current dark theme and layout scale.
8. **Verification**
   - Run a targeted lint check on the dashboard files touched by this change.
   - Visually confirm the dashboard shows vendor-specific content after login.

## Files Expected To Change
- `app/dashboard/page.tsx`
- `services/filemakerService.ts`
- `app/api/...` files as needed for dashboard data access

## Potential Risks
- The dashboard may need more than one API call depending on how vendor profile and counts are sourced.
- Some count values may need aggregation logic if FileMaker does not provide them directly.
- The recent-orders table can become brittle if the row shape is not normalized before reaching the UI.

## Acceptance Criteria
- [ ] The dashboard is populated with vendor-specific data after login.
- [ ] The company profile, count cards, and five recent orders are driven by live data.
- [ ] The dashboard still uses the existing dark shell and does not regress visually.
- [ ] Missing fields are handled safely with fallback values.
- [ ] The touched files pass targeted lint verification.
