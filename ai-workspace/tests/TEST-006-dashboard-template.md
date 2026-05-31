# Test Scenarios: TEST-006-dashboard-template

Ticket: T-006-dashboard-template

## Objective
Verify that the static dashboard template renders correctly, matches the approved layout intent, and preserves the expected desktop scrolling behavior.

## Proposed Strategy
Manual UI verification in the local Next.js application, plus a targeted lint check for the dashboard files.

## Scenarios
- [ ] **Dashboard Route Renders**
  - Open `http://localhost:3000/dashboard`.
  - Expected: The dashboard loads without runtime errors and shows the sidebar, header, metric cards, company profile, and recent orders sections.

- [ ] **Desktop Visual Structure Matches Intent**
  - View the dashboard on a standard desktop-sized viewport.
  - Expected: The page uses the dark navy and maroon theme, the layout feels proportionate, and the content no longer appears oversized.

- [ ] **Sidebar Remains Fixed While Scrolling**
  - Scroll the dashboard content vertically on desktop.
  - Expected: The left sidebar remains fixed in place while the main content area scrolls.

- [ ] **Header and Table Behave Cleanly**
  - Verify the top header remains usable and the Recent Orders table does not visually break at normal desktop widths.
  - Expected: Search, utility icons, logout, and table layout remain aligned without unintended overflow.

- [ ] **Targeted Lint Verification**
  - Run `npx eslint app/dashboard/layout.tsx app/dashboard/page.tsx`.
  - Expected: The dashboard files pass lint successfully.
