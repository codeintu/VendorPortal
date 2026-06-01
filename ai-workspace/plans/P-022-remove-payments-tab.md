# Implementation Plan: P-022-remove-payments-tab

Linked Ticket: T-022-remove-payments-tab

## Objective
Remove the "Payments" tab from the sidebar navigation in the dashboard layout.

## Proposed Approach
1. Locate the navigation items array inside `app/dashboard/layout.tsx`.
2. Remove `{ href: "#", label: "Payments", icon: CreditCard }` from the sidebar navigation items array.
3. Clean up the unused `CreditCard` icon import from `lucide-react`.
4. Run target verification including TypeScript type checks (`npx tsc --noEmit`) and target eslint checks.

## Files Expected To Change
- `app/dashboard/layout.tsx`

## Risks / Notes
- None (This is a low-risk UI-only change).

## Acceptance Criteria
- [ ] The "Payments" tab is completely removed from the dashboard left-hand sidebar navigation list.
- [ ] The remaining items (Dashboard, Orders, Profile) render and navigate properly.
- [ ] Unused imports (specifically `CreditCard`) are removed from `app/dashboard/layout.tsx`.
- [ ] Touched files pass TypeScript compilation and lint verification.
