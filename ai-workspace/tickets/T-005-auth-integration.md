# Ticket: T-005-auth-integration

Status: COMPLETED
Created: 2026-03-15
Author: AI Agent

## Problem Statement
The Vendor Portal currently contains three isolated layers: 
1. The Login UI (`app/login/page.tsx`).
2. The mocked Auth API (`app/api/auth/login/route.ts`).
3. The FileMaker Service layer (`services/filemakerService.ts`).
These components do not "talk" to each other yet, meaning no real authentication can occur.

## Goal
Wire the existing architectural layers together to create a single cohesive login flow. The UI must send the credentials via an HTTP POST request to the Next.js API, the API must invoke the FileMaker Service's `findVendorByCredentials()` function, and the UI must gracefully handle both successful and failed FileMaker lookups.

## Scope
1. **API Route Modification**: Update `app/api/auth/login/route.ts` to strip out the mock logic, dynamically call `findVendorByCredentials(email, password)`, and map the FileMaker `fieldData` response back to the client.
2. **UI Component Modification**: Update `app/login/page.tsx`'s `handleSubmit()` to actually execute `fetch('/api/auth/login')`.
3. **Redirection Logic**: On a successful 200 HTTP response, the UI should use Next.js string routing to push the user to the `/` root dashboard (which currently redirects back to login; it will represent a blank success state for now).

## Out of Scope
- Full robust JWT cookie session generation with `NextAuth.js` or standard sessions (we will handle persistent encrypted state management in another ticket; this focuses purely on the single-fire query integration connecting UI to API to DB).

## Acceptance Criteria
- [ ] A valid FileMaker credential submitted via the UI logs the user in and redirects them to `/dashboard` or `/overview` upon resolving the `fetch()`.
- [ ] An invalid FileMaker credential correctly bubbles the 401 Unauthorized FileMaker error to the UI and visually displays the error message without crashing.
