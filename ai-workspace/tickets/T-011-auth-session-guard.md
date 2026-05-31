# Ticket: T-011-auth-session-guard

Status: CLOSED
Created: 2026-03-18
Author: AI Agent

## Problem Statement
The app still allows a logged-out user to return to protected dashboard pages via the browser back button, and some dashboard data loaders still fall back to the hardcoded vendor ID `2169`. This allows the wrong vendor context to be loaded instead of forcing a fresh login.

## Goal
Remove the static vendor fallback and make dashboard access depend on the signed-in vendor context only. After logout, the user should not be able to re-enter the dashboard through browser history without logging in again.

## Scope
1. Remove the `2169` fallback from dashboard data loading.
2. Make the dashboard and orders pages redirect to `/login` if `vendorId` is missing.
3. Change login/logout navigation to use history-safe redirects.
4. Keep vendor identity in local storage only as a temporary client-side session marker.
5. Preserve the current dashboard shell and visual design.

## Out of Scope
- Server-side session management
- Token-based auth redesign
- Changes to FileMaker query logic beyond removing the fallback behavior
- Visual redesign of the dashboard or orders pages

## Acceptance Criteria
- [x] Dashboard pages no longer fetch data for the hardcoded `2169` fallback.
- [x] Missing vendor identity redirects the user to `/login`.
- [x] Logout prevents back-button re-entry into the dashboard.
- [x] Login and logout flows use history-safe navigation.
- [x] The touched files pass targeted lint verification.
