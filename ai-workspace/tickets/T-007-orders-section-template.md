# Ticket: T-007-orders-section-template

Status: CLOSED
Created: 2026-03-16
Author: AI Agent

## Problem Statement
The Vendor Portal currently has a dashboard landing page, but the dedicated Orders section is not yet designed. The user has provided a light-theme reference for a Purchase Orders screen and wants a similar experience adapted into the current dark navy and maroon portal theme.

## Goal
Create a static dark-theme Orders screen template that fits naturally inside the existing dashboard shell and visually mirrors the provided reference. The screen should include a page heading, filter/search controls, status tabs, an export action, and an orders table with pagination.

## Scope
1. Add a dedicated Orders page route inside the dashboard area.
2. Update dashboard navigation so the Orders item can represent the active section when that route is opened.
3. Build a dark-theme Purchase Orders page containing:
   - page title and supporting subtitle
   - filter/search input
   - status filter tabs (All, Open, In Transit, Delivered)
   - export button
   - purchase order table with order id, date, items summary, amount, status, and actions
   - footer area with entry count and pagination controls
4. Use static mock data only for now.

## Out of Scope
- Live FileMaker data integration
- Working search/filter logic
- Functional export behavior
- Real pagination or row actions
- Back-end API changes

## Acceptance Criteria
- [x] A dedicated Orders page exists and renders inside the current dashboard shell.
- [x] The Orders screen follows the existing dark theme rather than the light-theme reference literally.
- [x] The page includes the main UI regions from the reference: header, filters, tabs, table, and pagination.
- [x] The Orders navigation item appears active when viewing the Orders screen.
- [x] The screen renders cleanly on standard desktop widths without broken alignment.
