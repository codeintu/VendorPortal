# Implementation Plan: P-013-light-default-theme

Linked Ticket: T-013-light-default-theme

## Strategy
We will introduce a minimal but real theme system that uses light mode as the default and keeps dark mode as an alternate supported theme. The safest path is to centralize the theme state in the root layout or a small client provider, then update the global CSS variables so both themes are driven by the same semantic tokens instead of hardcoded page-specific colors.

## Implementation Steps

1. **Define the Theme Model**
   - Choose a simple light/dark theme approach that works with the current Next.js app.
   - Store the active theme in browser storage so the preference survives refreshes.
   - Default to light mode when no saved preference exists.
2. **Update Global Theme Variables**
   - Refactor `app/globals.css` so the base palette is light-first.
   - Add dark theme overrides for the same semantic tokens used by Tailwind and the UI components.
   - Keep the variable names stable so existing components continue to read from the same design tokens.
3. **Wire the Theme Toggle**
   - Replace the decorative dashboard toggle with a real action that changes the active theme.
   - Make the toggle behavior available from the shared dashboard shell so it works on both Dashboard and Orders.
4. **Audit the Existing Screens**
   - Check the login page, dashboard shell, dashboard content, and orders table for places where hardcoded dark colors should now use semantic theme tokens.
   - Keep brand accents such as the maroon primary, but make surfaces and text respond correctly to the active theme.
5. **Verification**
   - Run targeted lint checks on the touched theme and dashboard files.
   - Confirm the app loads light by default, switches to dark on demand, and keeps the chosen theme after refresh.

## Files Expected To Change
- `app/globals.css`
- `app/layout.tsx`
- `app/dashboard/layout.tsx`
- `app/login/page.tsx`
- `app/dashboard/page.tsx`
- `app/dashboard/orders/page.tsx`
- Possibly a new shared theme provider or hook under `app/` or `components/`

## Potential Risks
- If we only flip the root colors without auditing hardcoded page classes, some sections may still look dark while the rest is light.
- A poorly scoped theme provider can cause hydration mismatches if it reads browser storage too early.
- The dashboard currently uses many hardcoded dark utility classes, so this may require a careful pass rather than a single global switch.

## Acceptance Criteria
- [ ] Light mode is the default visual state.
- [ ] Dark mode can be enabled and persists across reloads.
- [ ] The theme toggle in the dashboard shell works for the portal.
- [ ] The current dashboard and orders pages remain readable and polished in both themes.
- [ ] The touched files pass targeted lint verification.
