# Ticket: T-022-remove-payments-tab

Status: IN PROGRESS
Created: 2026-06-01
Author: AI Agent

## Problem Statement
The dashboard sidebar currently contains a "Payments" navigation tab linking to `#`. Since payments are out of scope for this vendor portal version, this tab is confusing, redundant, and needs to be removed from the sidebar.

## Goal
Remove the "Payments" tab from the sidebar navigation in the dashboard layout.

## Scope
1. Remove the "Payments" navigation item from the sidebar link array in `app/dashboard/layout.tsx`.
2. Remove any unused icon imports (such as `CreditCard` from `lucide-react`) in `app/dashboard/layout.tsx` to maintain clean imports.

## Out of Scope
- Modifying order status, invoice details, or other core billing/payment-related fields in orders or dashboard pages.
- Altering the other navigation links (Dashboard, Orders, Profile).

## Acceptance Criteria
- [ ] The "Payments" tab is completely removed from the dashboard left-hand sidebar navigation list.
- [ ] The remaining items (Dashboard, Orders, Profile) render and navigate properly.
- [ ] Unused imports (specifically `CreditCard`) are removed from `app/dashboard/layout.tsx`.
- [ ] Touched files pass TypeScript compilation and lint verification.
