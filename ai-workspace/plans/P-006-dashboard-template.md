# Implementation Plan: P-006-dashboard-template

Linked Ticket: T-006-dashboard-template

## Strategy
To replicate the provided dashboard screenshot, we will build a static dashboard template using the existing App Router structure and current theme variables.

We will separate the work into two layers:

1. `app/dashboard/layout.tsx` for the persistent dashboard shell.
2. `app/dashboard/page.tsx` for the page-specific content blocks.

The application already includes `lucide-react`, so we will use it for navigation, utility, metric, and placeholder profile icons. No dependency changes are expected.

Because this ticket is strictly for UI scaffolding, the dashboard will use static content for now. The markup should still be organized cleanly so that future FileMaker-backed data can replace the mock values without a full rewrite.

## Implementation Steps

1. **Confirm Existing UI Foundation**
   - Reuse the theme variables defined in `app/globals.css`.
   - Reuse existing UI primitives such as `Input` where it fits the design.
   - Use `lucide-react` directly without modifying `package.json`.
2. **Implement Dashboard Shell in `app/dashboard/layout.tsx`**
   - Build the persistent left sidebar and top header.
   - Keep the sidebar fixed-width on desktop and the content area fluid.
   - Use a placeholder profile/avatar icon instead of a real avatar image for now.
3. **Implement Sidebar Navigation**
   - Add the logo/title area.
   - Add navigation items for Dashboard, Orders, Payments, Profile, and Settings.
   - Style Dashboard as the active item using the maroon accent from the screenshot.
4. **Implement Header Area**
   - Add the search field.
   - Add utility icons for theme/notifications.
   - Add a logout action styled to match the reference.
5. **Implement Dashboard Content in `app/dashboard/page.tsx`**
   - Add the welcome heading and subtitle.
   - Add three metric cards in a single desktop row.
   - Add the Company Profile section with icon area, business details, and contact details.
   - Add the Recent Orders table with static rows and status pills.
6. **Handle Responsive Behavior**
   - Ensure the layout degrades cleanly on smaller screens.
   - Prevent unnecessary horizontal overflow, especially around the sidebar, header, and orders table.
7. **Visual Verification**
   - Run the application locally and compare the dashboard with the provided design reference.

## Files Expected To Change
- `app/dashboard/layout.tsx`
- `app/dashboard/page.tsx`

## Potential Risks
- The design is desktop-first, so mobile and tablet behavior will need deliberate simplification to avoid visual breakage.
- Exact spacing, density, and icon sizing may need one refinement pass after the first implementation.
- Since the content is static for now, the structure should avoid being overly coupled to mock data values.

## Acceptance Criteria
- [ ] The dashboard uses a persistent shell with a left sidebar and top header.
- [ ] The sidebar includes the required navigation items and shows Dashboard as the active state.
- [ ] The sidebar profile area uses a placeholder profile/avatar icon for now.
- [ ] The top header includes a search field, utility icons, and a logout action.
- [ ] The main content includes the welcome section, three metric cards, a Company Profile section, and a Recent Orders table.
- [ ] The visual styling uses the existing dark navy and maroon theme variables from `globals.css`.
- [ ] The dashboard renders cleanly on standard desktop widths without broken alignment or unintended horizontal scrolling.
- [ ] The layout degrades reasonably on smaller screens, even if it remains primarily optimized for desktop.
