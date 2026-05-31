# Implementation Plan: P-012-dashboard-loading-skeleton

Linked Ticket: T-012-dashboard-loading-skeleton

## Strategy
We will keep the existing shared dashboard data flow, but replace the current first-load fallback with a richer skeleton state. Instead of showing static-looking metric cards before data arrives, the page should render a dark-mode shell that resembles the real dashboard structure and uses subtle shimmer or pulse animation to signal loading.

## Implementation Steps

1. **Define the Loading Shape**
   - Mirror the actual dashboard layout with skeleton blocks for:
     - headline/subtitle
     - three summary cards
     - company profile card
     - recent orders table rows
   - Keep the spacing and card sizes close to the final layout so the page does not jump when data arrives.
2. **Create Reusable Skeleton UI**
   - Add a small local skeleton helper or lightweight reusable loading component.
   - Use neutral dark placeholders with shimmer or pulse styling that fits the current theme.
3. **Swap the First-Load Placeholder**
   - Update the dashboard page to render the skeleton while summary data is loading for the first time.
   - Avoid showing the real metric cards until actual vendor data has loaded.
4. **Preserve Cached Route Switching**
   - Keep the shared provider behavior so moving between Dashboard and Orders does not trigger a full re-load of the same vendor data.
   - Ensure the skeleton only appears when the dashboard really has no ready data yet.
5. **Verification**
   - Run targeted lint checks on the touched dashboard files.
   - Confirm the first login experience shows the skeleton until the summary finishes loading.

## Files Expected To Change
- `app/dashboard/page.tsx`
- `app/dashboard/dashboard-data-context.tsx`
- `app/dashboard/layout.tsx` if a shared skeleton wrapper is needed

## Potential Risks
- If the skeleton is too different from the final layout, the loading experience may still feel jumpy.
- If the loading state logic is too aggressive, it could briefly flash skeletons even when cached data already exists.
- We should keep the skeleton lightweight so the loading UI itself does not slow down first render.

## Acceptance Criteria
- [ ] First login shows a dashboard-shaped skeleton instead of static content blocks.
- [ ] The skeleton matches the portal's dark theme and layout rhythm.
- [ ] Route changes still reuse loaded dashboard data where possible.
- [ ] The touched files pass targeted lint verification.
