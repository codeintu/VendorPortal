# Ticket: T-010-logout-flow

Status: CLOSED
Created: 2026-03-18
Author: AI Agent

## Problem Statement
The dashboard shell already shows a Logout action, but it does not actually sign the user out. The portal currently stores vendor identity in browser storage, so the logout flow needs to clear that state and return the user to the login screen.

## Goal
Implement a working logout flow from the dashboard shell that clears the current vendor session state on the client and routes the user back to `/login`.

## Scope
1. Wire the existing Logout button in the dashboard shell.
2. Clear client-side vendor session state, including:
   - `vendorId`
   - `vendorName`
   - any other login-related local storage values used by the app
3. Redirect the user to `/login` after logout.
4. Keep the logout action available from the shared dashboard layout so it works on both Dashboard and Orders pages.
5. Make the logout flow safe to use even if local storage is empty or partially missing.

## Out of Scope
- Server-side session invalidation
- Token revocation on FileMaker
- Reworking login or auth architecture
- Changing the dashboard visual design beyond wiring the button behavior

## Acceptance Criteria
- [x] Clicking Logout clears the client-side vendor state.
- [x] The user is redirected to `/login` after logout.
- [x] Logout works from any page that uses the dashboard shell.
- [x] The flow does not crash if local storage is already empty.
- [x] The touched files pass targeted lint verification.
