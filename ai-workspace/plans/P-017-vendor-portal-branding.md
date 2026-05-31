# Implementation Plan: P-017-vendor-portal-branding

Linked Ticket: T-017-vendor-portal-branding

## Objective
Refresh the portal branding so the header and login screen use the correct logo and the "Vendor Portal" text reads at a more balanced size.

## Proposed Approach
1. Identify the shared branding spots
   - Update the dashboard shell brand block in `app/dashboard/layout.tsx`.
   - Update the login page branding block in `app/login/page.tsx`.
2. Replace the current mark
   - Use the provided logo image URL: `https://www.kibizsystems.com/wp-content/uploads/UsSpiceLogo.png`.
   - Prefer a reusable image-based brand element so both screens stay consistent.
3. Rebalance the wordmark
   - Increase the "Vendor Portal" text size and adjust spacing/weight so it no longer looks undersized next to the logo.
   - Keep the brand area compact enough to fit both desktop and mobile layouts cleanly.
4. Preserve existing UI behavior
   - Leave navigation, theme toggling, and auth flow untouched.
   - Make sure the new logo treatment still works with the current light/dark theme system.
5. Verification
   - Run targeted lint checks on the touched header and login files.
   - Confirm the branding looks proportionate on both the login page and dashboard shell.

## Files Expected To Change
- `app/dashboard/layout.tsx`
- `app/login/page.tsx`
- Possibly `next.config.*` if remote image handling needs to be allowed
- Possibly a small shared brand component if we extract the logo block for reuse

## Risks / Notes
- If the logo is loaded remotely, we may need to confirm the app’s image configuration allows the domain.
- The brand block appears in both places, so a small shared component may be cleaner than duplicating markup.
- We should keep the header compact on smaller screens so the larger text does not crowd the rest of the layout.

## Acceptance Criteria
- [ ] The supplied logo is visible in the dashboard shell and login page.
- [ ] The "Vendor Portal" text is resized for visual balance.
- [ ] The brand treatment remains responsive and theme-safe.
- [ ] The touched files pass targeted lint verification.
