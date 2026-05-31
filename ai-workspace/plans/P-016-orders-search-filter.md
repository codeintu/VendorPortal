# Implementation Plan: P-016-orders-search-filter

## Objective
Turn the orders filter bar into a real server-driven filter/search experience while preserving pagination and row navigation.

## Proposed Approach
1. Add filter and search parameters to the orders API route.
2. Extend the FileMaker service to query by status and purchase order number.
3. Make the orders page keep local state for:
   - active status filter
   - pending search text
   - committed search term
   - current page
4. Trigger the search only when the user presses Enter or exits the input.
5. Reset pagination back to page 1 whenever the active filter or committed search changes.
6. Keep the existing page-window pagination behavior intact.

## Filter Behavior
- Default filter: `Open`
- Available filters:
  - `All`
  - `Open`
  - `Closed`
  - `AP Pending`
- Filtering should be reflected in the data request, not only on the client.

## Search Behavior
- Search field should target `PONumber`
- Typing alone should not fetch
- Search should commit on:
  - Enter key
  - blur / exit from the input
- Committed search should refetch the first page of results

## Data Flow
- `app/dashboard/orders/page.tsx` owns the UI state and commits filter/search changes
- `app/api/orders/route.ts` accepts `status`, `poNumber`, `page`, and `pageSize`
- `services/filemakerService.ts` builds the FileMaker query using the active status and PO number

## Notes / Risks
- We should make sure the default `Open` filter does not break the dashboard summary counts or the order-detail links.
- If FileMaker query syntax needs exact matching for `PONumber`, the service should normalize the search term before sending it.
- Search and filter changes should clear the current page window so pagination stays predictable.

## Acceptance Criteria
- The default view loads `Open` orders.
- Status buttons update the result set.
- Search only fires on Enter or blur.
- Pagination still behaves correctly after filter/search changes.
