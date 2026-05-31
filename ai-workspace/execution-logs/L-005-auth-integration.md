# Execution Log: L-005-auth-integration

Ticket: T-005-auth-integration

## Steps Performed
1. Updated `app/api/auth/login/route.ts` to strip out mock JSON success payloads.
2. Imported `findVendorByCredentials` from `@/services/filemakerService` into the API route.
3. Added logic to map the returned FileMaker variables (`EmailAddress`, `CompanyName`) into the generic `vendor` identity object returned to the client, omitting sensitive attributes like `WebPassword`.
4. Handled server exceptions by introducing a generic `try/catch` wrapping the `findVendorByCredentials` execution, ensuring any FileMaker network exceptions return HTTP 500 without crashing the Next.js process.
5. In `app/login/page.tsx`, stripped the `setTimeout` simulation.
6. Implemented a synchronous `fetch('/api/auth/login', { method: 'POST', body: ... })` within the `handleSubmit` event.
7. Caught 4XX/5XX `!response.ok` states locally on the client to visually paint React error messages sourced safely from the API payload (`data.error`).
8. Integrated `useRouter` from `next/navigation` to push authenticated users gracefully to the `/dashboard`.
9. Created an empty landing `app/dashboard/page.tsx` to ensure `router.push('/dashboard')` hits a valid route boundary.

## Files Modified / Added
- `app/api/auth/login/route.ts` (MODIFIED)
- `app/login/page.tsx` (MODIFIED)
- `app/dashboard/page.tsx` (NEW)

## Notes
The application is now end-to-end logically connected to the external environment. The UI passes control to the middle-tier route, which invokes the `service` to interact directly with the `.env` configured FileMaker Data API.
