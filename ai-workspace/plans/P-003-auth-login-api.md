# Implementation Plan: P-003-auth-login-api

Linked Ticket: T-003-auth-login-api

## Strategy
We will utilize the Next.js App Router API route conventions to establish the authentication endpoint. By building a Route Handler at `app/api/auth/login/route.ts`, we handle incoming HTTP POST requests. 

The immediate requirement is a mock handler that asserts the presence of the required `email` and `password` payload fields, returning appropriate generic HTTP response codes (e.g., 200 OK, 400 Bad Request) and JSON bodies. 

This foundation serves a dual purpose: it unblocks the frontend UI to consume a local API, and it establishes the exact file where the future FileMaker Server HTTP service logic will be injected.

## Implementation Steps

1. **Establish Route Structure**: Create the nested directory `app/api/auth/login/` and the resulting `route.ts` file.
2. **Implement POST Handler**:
   - Export an `async function POST(request: Request)` from the route.
   - Use `request.json()` to parse the incoming JSON body payload.
3. **Basic Validation**:
   - Check if `email` and `password` exist and are valid strings.
   - If missing or invalid, return a `NextResponse.json` with a standard 400 status error block.
4. **Mock Execution**:
   - Return a `NextResponse.json` with a 200 status mimicking a successful login. The response should specifically match the mock structure expected by future FileMaker flows:
     ```json
     {
       "success": true,
       "vendor": { "email": "[email provided in request]" }
     }
     ```
   - Prepare a `TEST-003` document with cURL commands that can independently verify validation failures and mock successes without relying on the UI.

## Files Expected To Change

- `app/api/auth/login/route.ts` (NEW)
