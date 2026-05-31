# Test Scenarios: TEST-002-vendor-login-page

Ticket: T-002-vendor-login-page

## Objective
Verify the Vendor Portal login page correctly renders its UI utilizing global dynamic theme mapping and handles invalid client-side states.

## Proposed Strategy
Dry Run / Manual UI Validation. The user visually asserts that the structure and responsive aspects work when the development server runs.

## Scenarios

- [x] Theme Configuration: Colors correctly apply to backgrounds and buttons via `--primary` and `--background` variables.
- [x] Override Check: The dark maroon layout (`#0a0f1c`, `#b54a4a`) overrides any OS light-mode preference immediately.
- [x] Routing & Redirect: Accessing `http://localhost:3000/` automatically redirects to `http://localhost:3000/login`.
- [x] Form Structure: The Login UI displays an Email field, Password field (with `••••••••` placeholder), and Sign In button within the authentication card.
- [x] Visual Polish: A top maroon boundary highlights the auth card, input fields are flat dark layers, and the "U.S. SPICE MILLS INC." footer scales correctly at the bottom.
- [x] Client Validation: Attempting to submit the form without data generates a visual error: "Please fill in all required fields."
- [x] Loading State: Submitting valid input transitions the button to an active/loading state for simulated network fetching.
