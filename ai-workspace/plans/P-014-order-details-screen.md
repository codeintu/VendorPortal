# Implementation Plan: P-014-order-details-screen

Linked Ticket: T-014-order-details-screen

## Strategy
We will add a dynamic order-details route beneath the dashboard orders section and connect the orders list rows to it. The new screen should render one selected purchase order with a clear header summary and a line-item section. Since the current service layer only returns list-level purchase-order rows, the detail view will need a dedicated FileMaker fetch path for the order header and its line items.

## Implementation Steps

1. **Define the Detail Route**
   - Add a route such as `/dashboard/orders/[poNumber]` or `/dashboard/orders/[id]`.
   - Choose the identifier that best matches the FileMaker record lookup we already have available.
2. **Make the Orders List Clickable**
   - Turn each row or PO number in the orders table into a navigation target.
   - Preserve the current table layout and badge styling while adding row interaction.
3. **Create a Detail Data Flow**
   - Add a FileMaker service method for fetching a single order header record.
   - Add a second fetch for the order line items, likely from a separate FileMaker layout/table relationship if the current `Web_POD` layout does not expose them directly.
   - Extend `config/filemaker.ts` with the layout mapping needed for the line-item source once the exact FileMaker layout name is confirmed.
4. **Build the Order Details UI**
   - Show a header section with PO number, status, dates, vendor, and totals.
   - Render a line-items table or card list with item name, quantity, unit price, and line total.
   - Add a small supporting details area for notes, shipping, billing, or other metadata if available.
5. **Handle Loading and Missing Data**
   - Add a dedicated skeleton or loading state for the details page.
   - Show a friendly empty/error state if the selected order is not found.
6. **Verification**
   - Run targeted lint checks on the touched dashboard and service files.
   - Confirm an order can be opened from the list and the details page renders the expected data.

## Files Expected To Change
- `app/dashboard/orders/page.tsx`
- `app/dashboard/orders/[...]/page.tsx` or `app/dashboard/orders/[id]/page.tsx`
- `services/filemakerService.ts`
- `config/filemaker.ts`
- Potentially a new order-details skeleton component under `app/dashboard/orders/`

## Potential Risks
- We may need to confirm the exact FileMaker layout name for line items before implementing the fetch.
- If the route uses a URL field that is not unique, the wrong order could be opened.
- The details view should stay lightweight so it does not feel slower than the list page.

## Acceptance Criteria
- [ ] The orders list links to a dedicated order-details screen.
- [ ] The order details screen shows header information and line items.
- [ ] The screen respects the current light/dark theme system.
- [ ] The touched files pass targeted lint verification.
