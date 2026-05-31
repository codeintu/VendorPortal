# Test Scenarios: TEST-013-light-default-theme

Ticket: T-013-light-default-theme

## Objective
Verify that the portal defaults to light mode, the theme toggle works, and the chosen theme persists across refreshes.

## Proposed Strategy
Manual browser verification in the local app, plus targeted lint verification for the touched files.

## Scenarios
- [ ] **Default Theme Is Light**
  - Open the portal in a fresh browser session.
  - Expected: The app loads in light mode by default.

- [ ] **Theme Toggle Works**
  - Open the dashboard and click the theme toggle.
  - Expected: The UI switches between light and dark modes.

- [ ] **Theme Persists After Refresh**
  - Switch to dark mode, refresh the page, and return to the dashboard.
  - Expected: The portal remains in dark mode after refresh.

- [ ] **Dashboard Remains Usable In Both Themes**
  - Visit Dashboard and Orders in both light and dark mode.
  - Expected: Layout, text, tables, and cards remain readable and polished.

- [ ] **Targeted Lint Verification**
  - Run `npx eslint app/layout.tsx app/dashboard/layout.tsx app/dashboard/page.tsx app/dashboard/orders/page.tsx app/dashboard/dashboard-loading-skeleton.tsx components/theme-provider.tsx app/login/page.tsx components/ui/Input.tsx components/ui/Button.tsx components/ui/Label.tsx`.
  - Expected: All targeted files pass lint successfully.
