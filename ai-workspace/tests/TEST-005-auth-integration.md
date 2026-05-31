# Test Scenarios: TEST-005-auth-integration

Ticket: T-005-auth-integration

## Objective
Verify the end-to-end authentication flow functions by submitting credentials via the Next.js client, watching the API ping FileMaker, and observing the client state respond appropriately.

## Proposed Strategy
Manual UI Testing against the Live `.env` Server Configuration.

## Scenarios
- [x] **Valid Authenticated Login**:
  - Open `http://localhost:3000/login`
  - Input a valid `EmailAddress` and `WebPassword` known to exist in the `Web_Contacts` layout on the targeted FileMaker server.
  - Submit the form.
  - Expected: The loading spinner displays briefly, then the browser automatically redirects to `http://localhost:3000/dashboard` showing the "Vendor Dashboard" successful authentication screen.

- [x] **Invalid FileMaker Lookup (401 Trapping)**:
  - Open `http://localhost:3000/login`
  - Input a fake email (e.g., `doesnotexist@example.com`) and password (`wrong123`).
  - Submit the form.
  - Expected: The form remains on the `/login` route. A red error box renders at the top of the form reading: `"Invalid email or password."`

- [x] **Empty Payload Prevention**:
  - Open `http://localhost:3000/login`
  - Clear both the email and password inputs.
  - Submit the form.
  - Expected: No API/Network call is made. A red error box renders reading: `"Please fill in all required fields."`
