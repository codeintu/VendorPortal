# Test Scenarios: TEST-003-auth-login-api

Ticket: T-003-auth-login-api

## Objective
Verify the `POST /api/auth/login` endpoint correctly validates payloads and securely returns the exact mock JSON structure required for future FileMaker integration.

## Proposed Strategy
Independent verification using `curl` against the running Next.js server (`http://localhost:3000`). This ensures the API layer operates correctly independent of the UI state.

## Scenarios
*(Note: Executed via `Invoke-RestMethod` in PowerShell)*

- [x] **Valid Request (200 OK)**:
  Run: `curl -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"test@example.com\",\"password\":\"secure123\"}"`
  - Expected: returns `{"success":true,"vendor":{"email":"test@example.com"}}`

- [x] **Missing Payload (400 Bad Request)**:
  Run: `curl -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"test@example.com\"}"`
  - Expected: returns HTTP 400 and `{"error":"Invalid credentials. Email and password are required."}`

- [x] **Malformed Body (400 Bad Request)**:
  Run: `curl -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d "BAD JSON"`
  - Expected: returns HTTP 400 and `{"error":"Malformed request body"}`

- [x] **Mock Authentication Failure (401 Unauthorized)** *(Optional feature built into mock)*:
  Run: `curl -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"test@example.com\",\"password\":\"fail\"}"`
  - Expected: returns HTTP 401 and `{"error":"Invalid email or password."}`
