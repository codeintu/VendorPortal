# Test Scenarios: TEST-004-filemaker-service

Ticket: T-004-filemaker-service

## Objective
Verify the `FileMakerService` parses environment variables properly, centralizes layouts, and cleanly manages token caching syntax.

## Proposed Strategy
Dry Run/Code Review Validation since hitting a live database requires real FileMaker Server environment configurations which aren't currently mounted inside the sandbox context. We evaluate structural soundness.

## Scenarios
- [ ] **Instantiation Safety**: Verify `filemakerService.ts` doesn't crash on boot (environment vars are parsed only during function calls, not globally blocking startup).
- [ ] **Config Separation**: Layout constants successfully import from `config/filemaker.ts` isolated from `.env`.
- [ ] **Token Caching Structure**: Inspect `getAuthToken()` directly prevents duplicate `.fmi/data/.../sessions` calls by resolving `cachedToken` immediately.
- [ ] **Retry Semantics**: Inspect `fetchFM()` to ensure `getAuthToken(true)` correctly executes when HTTP 401 is trapped.
- [ ] **Data Mapping Conversion**: Verify `findVendorByCredentials` correctly processes "No Record Found" states by catching FileMaker's internal standard 401 error message behavior and handling gracefully instead of returning 500 status codes.
