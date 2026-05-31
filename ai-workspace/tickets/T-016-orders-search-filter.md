# Ticket: T-016-orders-search-filter

Status: CLOSED
Created: 2026-03-19
Author: AI Agent

## Problem Statement
The orders screen currently has a static filter bar, but the filter buttons and search box do not actually change the order list. The user wants the status filter to work with `All`, `Open`, `Closed`, and `AP Pending`, with `Open` as the default. They also want search to work by purchase order number and only trigger when the user presses Enter or leaves the search field.

## Goal
Add working search and filter behavior to the orders screen so the list can be narrowed by status and PO number without changing the existing row navigation or pagination UX.

## Scope
1. Make the status filter functional with `All`, `Open`, `Closed`, and `AP Pending`.
2. Default the orders view to `Open`.
3. Make PO-number search trigger on Enter or blur/exit of the input.
4. Apply the active filter/search to the orders API request.
5. Keep pagination and detail-page navigation working.

## Out of Scope
- Debounced live search
- Multi-field search
- Search suggestions or autocomplete
- Advanced analytics filters
- Editing order data

## Acceptance Criteria
- [x] The orders screen defaults to the `Open` status filter.
- [x] Clicking `All`, `Open`, `Closed`, or `AP Pending` updates the list.
- [x] Search only runs after Enter or when the search input loses focus.
- [x] Search matches purchase order number.
- [x] Pagination still works with the active filter/search.
- [x] Row click-through to order details still works.
- [x] Touched files pass targeted lint verification.
