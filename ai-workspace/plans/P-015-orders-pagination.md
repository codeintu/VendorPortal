# Implementation Plan: P-015-orders-pagination

## Objective
Replace the static orders list with a real paginated list that fetches purchase orders in chunks of 10 and supports next/previous navigation.

## Proposed Approach
1. Extend the FileMaker service so `getVendorPOs` can accept `page` and `pageSize` arguments.
2. Use FileMaker `_find` paging support to fetch only the active slice of purchase orders.
3. Return both the current page of orders and enough pagination metadata for the UI.
4. Update the orders API route to accept page query params and pass them through to the service.
5. Move the orders screen from a one-time load to page-driven loading with local page state.
6. Keep the existing row click-through to order details and preserve the current badge styling.

## UI Behavior
- Default page size: `10`
- Initial page: `1`
- Next button increments the page and refetches
- Previous button decrements the page and refetches
- The current page number should be visible in the pager
- Disable navigation buttons when the user is already at the first or last page

## Data Flow
- `app/dashboard/orders/page.tsx` owns the page state and requests the current page.
- `app/api/orders/route.ts` becomes page-aware.
- `services/filemakerService.ts` performs the paged FileMaker query and normalizes the response.

## Risks / Notes
- FileMaker paging support should be confirmed in the response shape before finalizing the metadata mapping.
- The dashboard summary should remain untouched; only the orders list gets paginated.
- If the API does not provide a total count, the pager can still work with next/previous using returned row count checks.

## Acceptance Criteria
- The orders list renders 10 rows or fewer per page.
- Navigation controls move through the dataset without breaking row navigation.
- The page state is reflected in the URL or the component state in a predictable way.
