# Ticket: T-014-order-details-screen

Status: CLOSED
Created: 2026-03-18
Author: AI Agent

## Problem Statement
The orders list shows only high-level purchase order rows. The user wants to click any order and open a dedicated order details screen that shows the order header, line items, and supporting details for that purchase order.

## Goal
Create a dedicated order details page that opens from the orders list and shows a full breakdown of the selected purchase order, including its line items and related metadata.

## Scope
1. Add a dedicated dynamic order-details route under the dashboard orders area.
2. Make the orders list rows navigate to the detail screen.
3. Fetch and render a single order header plus its line items.
4. Keep the detail screen aligned with the current light/dark theme system.
5. Preserve the current orders list experience and data flow.

## Out of Scope
- Editing or approving orders
- Workflow actions on line items
- PDF export or printing
- Reworking the FileMaker auth/session model

## Acceptance Criteria
- [x] Clicking an order opens a dedicated details page for that purchase order.
- [x] The details page shows order header information and line items.
- [x] The details page matches the portal theme in both light and dark modes.
- [x] The orders list remains usable after the new route is added.
- [x] The touched files pass targeted lint verification.
