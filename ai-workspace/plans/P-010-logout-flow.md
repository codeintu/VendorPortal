# Implementation Plan: P-010-logout-flow

Linked Ticket: T-010-logout-flow

## Strategy
We will keep the current dashboard shell and convert the existing Logout button into a real client-side action.

Because the app is currently using browser storage for vendor identity, logout should be handled as a clean client reset:

1. Remove vendor-specific values from `localStorage`.
2. Redirect the user to `/login`.
3. Keep the behavior available from the shared dashboard layout so it applies everywhere inside the dashboard shell.

This ticket should stay intentionally small and not introduce a larger auth/session redesign.

## Implementation Steps

1. **Confirm Stored Client State**
   - Review which login-related values are currently stored in browser storage.
   - Confirm the logout button lives in the shared dashboard layout.
2. **Add Logout Behavior to the Dashboard Shell**
   - Attach a click handler to the Logout button in `app/dashboard/layout.tsx`.
   - Clear all vendor/session-related local storage keys used by the app.
   - Redirect to `/login` after clearing state.
3. **Keep the Flow Defensive**
   - Ensure logout does not throw if local storage is empty or if keys are missing.
   - Keep the action working from both `/dashboard` and `/dashboard/orders`.
4. **Optional Cleanup**
   - If helpful, add a small helper for clearing the known vendor keys so the logic stays readable.
5. **Verification**
   - Run a targeted lint check on the dashboard layout and any helper files touched.
   - Confirm the browser returns to the login screen after logout.

## Files Expected To Change
- `app/dashboard/layout.tsx`
- `app/login/page.tsx` if any login-storage cleanup alignment is needed
- `app/lib/...` or `services/...` only if a small shared helper is introduced

## Potential Risks
- If more login-related client keys are added later, the logout cleanup list may need to expand.
- Because there is no server session yet, logout is currently only a client-side reset.
- Shared dashboard layout changes can affect both Dashboard and Orders routes, so the handler should stay minimal and reliable.

## Acceptance Criteria
- [ ] Logout clears the known vendor login state from browser storage.
- [ ] Logout redirects the user to `/login`.
- [ ] The action is available from the shared dashboard shell.
- [ ] The logout flow remains safe when no stored vendor data exists.
- [ ] The touched files pass targeted lint verification.
