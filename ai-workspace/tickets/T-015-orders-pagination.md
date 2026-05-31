# Ticket: T-015-orders-pagination

Status: CLOSED
Created: 2026-03-19
Author: AI Agent

## Problem Statement
The orders screen currently loads the full set of purchase orders at once and shows a static pager UI. The user wants the list to load a maximum of 10 orders per page and navigate through the remaining records using pagination controls.

## Goal
Add real pagination to the orders list so it fetches and renders 10 purchase orders at a time, with next/previous navigation and correct page state.

## Scope
1. Add page-based pagination to the orders API and service layer.
2. Fetch only one page of orders at a time from FileMaker.
3. Update the orders screen to request and render the active page.
4. Wire the next/previous controls to change pages and refetch data.
5. Keep the current order row click-through and status styling intact.

## Out of Scope
- Filtering
- Search
- Server-side sorting changes beyond what already exists
- Infinite scroll
- Pagination on the dashboard summary card

## Acceptance Criteria
- [x] The orders screen shows no more than 10 orders per page.
- [x] Clicking next loads the next page of orders.
- [x] Clicking previous loads the prior page of orders.
- [x] The page indicator reflects the current page.
- [x] The orders list row navigation still opens the correct detail page.
- [x] Touched files pass targeted lint verification.
