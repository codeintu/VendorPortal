# Implementation Plan: P-007-orders-section-template

Linked Ticket: T-007-orders-section-template

## Strategy
We will treat the shared screenshot as a structural reference rather than a direct color reference. The implementation will preserve the current Vendor Portal dark styling established in the dashboard shell while borrowing the layout ideas of the light-theme Orders page.

This work should remain a static front-end template only. The goal is to establish the full visual composition of the Orders section before introducing live order data or interactive filtering behavior.

The implementation will likely touch both the reusable dashboard shell and a new Orders page route so that navigation state matches the currently active section.

## Implementation Steps

1. **Establish the Route Structure**
   - Add a dedicated page for Orders under the dashboard route structure.
   - Keep the existing dashboard shell as the shared wrapper for both Dashboard and Orders pages.
2. **Make Navigation State Route-Aware**
   - Update the dashboard sidebar navigation so Dashboard is active on `/dashboard` and Orders is active on the new Orders route.
   - Keep the remaining navigation items as inactive placeholders.
3. **Build the Orders Page Header**
   - Add the page title `Purchase Orders`.
   - Add a short supporting subtitle consistent with the reference.
4. **Build the Filter and Toolbar Row**
   - Add a filter/search field styled in the current dark theme.
   - Add static status tabs for `All`, `Open`, `In Transit`, and `Delivered`.
   - Add an export button that visually matches the product style.
5. **Build the Orders Table Card**
   - Create a rounded card container matching the dashboard component language.
   - Add columns for order id, date, items summary, amount, status, and actions.
   - Use static mock rows inspired by the screenshot structure.
   - Style status badges in dark-theme variants for in-transit, delivered, pending, and delayed states.
6. **Build the Footer Controls**
   - Add static entry-count text.
   - Add static pagination controls styled for the dark theme.
7. **Responsive and Visual Refinement**
   - Ensure the screen remains readable on smaller widths, especially around the toolbar row and table overflow.
   - Keep the visual density aligned with the tuned dashboard scale rather than reverting to oversized elements.
8. **Verification**
   - Run a targeted lint check on the modified dashboard shell and new Orders page files.

## Files Expected To Change
- `app/dashboard/layout.tsx`
- `app/dashboard/orders/page.tsx`

## Potential Risks
- Route-aware sidebar highlighting may require small structural adjustments to the existing shared layout.
- The toolbar row has several elements, so compact responsive behavior will need deliberate handling.
- The table design can become visually heavy in dark mode if borders, muted text, and status colors are not balanced carefully.

## Acceptance Criteria
- [ ] A new dark-theme Orders page exists under the dashboard route structure.
- [ ] The Orders page uses the existing shell and marks Orders as the active navigation item.
- [ ] The page includes the title, subtitle, filter field, status tabs, export action, orders table, and pagination area.
- [ ] The table and toolbar match the current dashboard density and theme language.
- [ ] The modified files pass targeted lint verification.
