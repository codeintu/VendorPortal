# Ticket: T-008-fetch-purchase-orders

Status: CLOSED
Created: 2026-03-18
Author: AI Agent

## Problem Statement
The Vendor Portal needs to fetch real purchase order data for the logged-in vendor. Initial implementation showed a "Field is missing" error and used a hardcoded vendor ID.

## Goal
Implement a dynamic, error-free data fetching flow from the `Web_POD` layout, ensuring the vendor ID is retrieved from the authenticated session.

## Scope
1.  **Auth Update**: Modify login API to return the vendor's unique ID.
2.  **State Management**: Persist vendor ID in `localStorage` on login.
3.  **Service Fix**: Resolve "Field is missing" error by using the correct filter field name in the query.
4.  **UI Integration**: Update Orders page to use the dynamic vendor ID and display 7 columns.
