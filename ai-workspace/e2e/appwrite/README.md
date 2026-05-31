# Appwrite E2E

This folder contains Appwrite-related end-to-end test coverage.

Current test:
- `login.spec.ts` - verifies the portal login flow against the local app

To run the login test with credentials:
- `LOGIN_EMAIL=...`
- `LOGIN_PASSWORD=...`
- `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000` if needed
