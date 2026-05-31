# Ticket: T-003-auth-login-api

Status: COMPLETED
Created: 2026-03-15
Author: AI Agent

## Problem Statement
The Vendor Login UI relies on an authentication API endpoint to process credentials, which has not yet been implemented.

## Goal
Implement a Next.js API route (`POST /api/auth/login`) that accepts email and password credentials, performs basic validation, and returns a simulated (mock) response. This prepares the backend architecture for a future FileMaker Data API integration.

## Scope
- Create the route handler for `POST /api/auth/login`.
- Extract and validate `email` and `password` properties from the request body.
- Return structured mock JSON responses indicating success or validation failure.
- Ensure the route aligns with the repository's App Router architecture.

## Out of Scope
- Actual live FileMaker Data API connection (will be handled in a separate ticket).
- Database querying.
- Real JWT token generation or session management middleware (will implement mock tokens for now if necessary, or just basic JSON status objects).

## Acceptance Criteria
- [ ] A POST request to `/api/auth/login` containing valid email and password returns a 200 OK mock success response.
- [ ] A POST request with missing credentials returns a 400 Bad Request error.
- [ ] The folder structure gracefully supports scaling into future service abstractions.
