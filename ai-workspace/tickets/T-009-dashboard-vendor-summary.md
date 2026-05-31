# Ticket: T-009-dashboard-vendor-summary

Status: CLOSED
Created: 2026-03-18
Author: AI Agent

## Problem Statement
The dashboard currently uses static mock values for company details, order counts, and recent orders. After login, the dashboard should show the logged-in vendor's real company summary, account counts, and the five most recent orders.

## Goal
Replace the dashboard's static content with vendor-specific data so the landing screen becomes a live summary of the authenticated vendor account.

## Scope
1. Load vendor company details on the dashboard after login.
2. Show vendor-specific counts for:
   - Active Orders
   - Pending Invoices
   - Closed Orders
3. Show the five most recent purchase orders for the vendor.
4. Keep the current dashboard layout and dark theme, but swap the static mock values for live data.
5. Use the existing vendor identity mechanism already available in the app, without redesigning authentication in this ticket.

## Out of Scope
- Reworking the login flow
- Changing how vendor identity is stored long term
- Building new dashboard sections beyond the company summary, count cards, and recent orders
- Adding edit actions or drill-down pages for the dashboard rows

## Acceptance Criteria
- [ ] The dashboard displays real vendor company details instead of static placeholder values.
- [ ] The Active Orders, Pending Invoices, and Closed Orders cards reflect vendor-specific counts.
- [ ] The dashboard shows the five most recent orders for the logged-in vendor.
- [ ] The current dark dashboard layout remains visually intact.
- [ ] Missing or incomplete vendor data renders safely without runtime crashes.
