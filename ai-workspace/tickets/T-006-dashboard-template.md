# Ticket: T-006-dashboard-template

Status: CLOSED
Created: 2026-03-16
Author: AI Agent

## Problem Statement
The user requires a Vendor Dashboard screen layout that matches a provided dark-theme screenshot. Currently, the dashboard is a blank placeholder succeeding the login flow. We need to scaffold the UI structure before connecting it to live data.

## Goal
Implement a pixel-perfect, static front-end React template for the Vendor Dashboard (`app/dashboard/page.tsx`). The layout will feature a left navigation sidebar, a top header with search/icons, three metric cards, a Company Profile summary section, and a Recent Orders table, all styled perfectly to match the provided maroon/navy dark theme.

## Scope
1. **Layout Shell**: Create a persistent layout wrap (sidebar + top header + main content area).
2. **Left Sidebar**: 
   - App Logo & "Vendor Portal" title.
   - Navigation links (Dashboard, Orders, Payments, Profile, Settings) with hover/active states (Dashboard should be active maroon).
   - Bottom user profile snippet (Alex Rivera).
3. **Top Header**:
   - Global search bar input.
   - Utility icons (Sun/Moon, Notifications, Logout button with maroon color).
4. **Main Content Metrics**:
   - Welcome title and subtitle.
   - Three stat cards: "Active Orders", "Pending Invoices", "Closed Orders" with respective icons and secondary text.
5. **Main Content Profile**:
   - "Company Profile" block featuring a factory icon placeholder, Company Name, Address, Vendor/Tax IDs, and Primary Contact details.
6. **Main Content Table**:
   - "Important Info & Recent Orders" table.
   - Columns: Order ID (maroon text), Date, Items (truncated), Amount, Status (pill badges: In Transit, Delivered).

## Out of Scope
- Actually fetching live data from FileMaker or the `/api` route.
- Interactive states (e.g., clicking on rows won't open detail pages yet).
- Global layout components (Next.js `layout.tsx` for nested routing will be used if appropriate, otherwise just a complex `page.tsxT`).

## Acceptance Criteria
- [ ] Visual structure identically matches the provided mock image using TailwindCSS.
- [ ] No layout broken on default desktop dimensions.
- [ ] Variables defined in `globals.css` (primary, card, background) are utilized.
