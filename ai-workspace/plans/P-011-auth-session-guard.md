# Implementation Plan: P-011-auth-session-guard

Linked Ticket: T-011-auth-session-guard

## Strategy
We will treat `vendorId` in `localStorage` as the temporary client-side session marker, but we will stop using a hardcoded fallback. If the app cannot find a vendor ID, it should behave like the user is not authenticated and return them to `/login`.

To stop browser history from bringing the user back into the dashboard after logout, we should also use history replacement on the login and logout transitions.

## Implementation Steps

1. **Remove the Static Vendor Fallback**
   - Update the dashboard summary page and orders page so they no longer use `2169` when `vendorId` is missing.
   - If no vendor ID is available, redirect the user back to `/login`.
2. **Make Login and Logout History-Safe**
   - Change the login redirect to use `router.replace('/dashboard')`.
   - Change logout to use `router.replace('/login')`.
3. **Add Client-Side Access Guards**
   - Ensure the dashboard and orders pages check for a stored vendor ID before fetching data.
   - Keep the redirect logic defensive so missing or cleared storage does not crash the page.
4. **Keep Data Loading Safe**
   - Avoid firing dashboard or orders fetches until the vendor ID is confirmed.
   - Preserve the existing loading and error states where possible.
5. **Verification**
   - Run targeted lint checks on the touched dashboard and login files.
   - Confirm that logout followed by browser back does not re-open the dashboard session.

## Files Expected To Change
- `app/login/page.tsx`
- `app/dashboard/layout.tsx`
- `app/dashboard/page.tsx`
- `app/dashboard/orders/page.tsx`

## Potential Risks
- If the redirect guard runs too late, a brief flash of dashboard content may still occur before redirecting.
- Because the app still uses local storage rather than a server session, this is a client-side guard rather than a full auth system.
- If future pages also rely on `vendorId`, they will need the same guard pattern.

## Acceptance Criteria
- [ ] The app does not use `2169` as a fallback vendor ID anywhere in the dashboard flow.
- [ ] Dashboard pages redirect to `/login` when `vendorId` is missing.
- [ ] Login and logout use history replacement to reduce back-button re-entry.
- [ ] The touched files pass targeted lint verification.
