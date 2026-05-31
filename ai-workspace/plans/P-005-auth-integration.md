# Implementation Plan: P-005-auth-integration

Linked Ticket: T-005-auth-integration

## Strategy
We will perform a two-step integration. 

First, we will connect the middle layer (the Next.js Route Handler) to the data layer (the FileMaker service). We'll replace the hardcoded "fail" check and static JSON return with a live asynchronous call to `findVendorByCredentials`.

Second, we will connect the presentation layer (Login UI) to the middle layer. We will remove the `setTimeout` simulation in `page.tsx`, execute a standard browser `fetch` API call, and read the JSON response. If the response contains an `error` key (due to a 400 or 401 status), we update the React `setError` state. If the response is successful, we instruct the Next.js `useRouter` hook to redirect the visitor to a newly created (or existing) success landing page (`/dashboard`).

## Implementation Steps

1. **Update API Route (`route.ts`)**:
   - Import `findVendorByCredentials` from `@/services/filemakerService`.
   - Await the function passing in the `{email, password}` parsed from the payload.
   - If the function returns `null`, respond with `401 Unauthorized` (`Invalid credentials or vendor not found`).
   - If the function returns the vendor data object, respond with `200 OK` and a sanitized `vendor` object (omitting passwords/hashes).

2. **Update UI Form (`page.tsx`)**:
   - Import `useRouter` from `next/navigation`.
   - Replace the `setTimeout` inside `handleSubmit` with a `try/catch` wrapping a `fetch('/api/auth/login')` POST request.
   - On response error (`!response.ok`), read `data.error` and call `setError()`.
   - On response success, call `router.push('/dashboard')`.

3. **Create Blank Target Dashboard**:
   - Create a barebones `app/dashboard/page.tsx` just so we have a target coordinate that isn't `redirect('/login')` to verify routing success.

4. **Testing Phase**:
   - Manually click the "Sign In" button via the local browser.
   - Check the terminal logs to verify FileMaker's Data API is queried cleanly.

## Files Expected To Change
- `app/api/auth/login/route.ts` (MODIFIED)
- `app/login/page.tsx` (MODIFIED)
- `app/dashboard/page.tsx` (NEW)
