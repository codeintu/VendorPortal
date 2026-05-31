# Ticket: T-004-filemaker-service

Status: COMPLETED
Created: 2026-03-15
Author: AI Agent

## Problem Statement
The Vendor Portal requires a mechanism to communicate with the hosted FileMaker server to authenticate users, fetch details, and retrieve Purchase Orders using the FileMaker Data API.

## Goal
Establish a centralized architectural service layer located at `services/filemakerService.ts`. This service will act as the single source of truth for all communication with the FileMaker server, abstracting FileMaker Data API complexities away from Next.js API routes and UI components.

## Scope
- Create the core `FileMakerService` class/functions.
- Implement session management (authenticating with FileMaker to get a token).
- Implement required methods:
  - `findVendorByCredentials(email, password)`
  - `getVendorDetails(vendorId)`
  - `getVendorPOs(vendorId)`
- Ensure all configuration relies on environment variables (`FILEMAKER_HOST`, `FILEMAKER_DATABASE`, etc.).

## Out of Scope
- Actually connecting the Next.js `POST /api/auth/login` endpoint to this service (this will be a separate integration ticket).
- Creating or editing UI components.

## Acceptance Criteria
- [ ] Centralized `services/filemakerService.ts` exists.
- [ ] No hardcoded credentials exist; variables are read from `.env.local` process.env.
- [ ] Required methods (`findVendorByCredentials`, `getVendorDetails`, `getVendorPOs`) are exported and defined.
