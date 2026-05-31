# Ticket: T-013-light-default-theme

Status: CLOSED
Created: 2026-03-18
Author: AI Agent

## Problem Statement
The portal currently renders in a dark-first visual style, and the theme toggle in the dashboard header is only decorative. The user wants the default experience to be light mode while still keeping dark mode available.

## Goal
Introduce a real theme system with light mode as the default, while preserving the existing dark theme as an available option for the portal.

## Scope
1. Add actual light/dark theme switching behavior.
2. Make light mode the default theme for first-time visitors.
3. Preserve dark mode styling as an alternate theme.
4. Persist the user’s theme choice across visits.
5. Wire the dashboard theme toggle to the new theme behavior.

## Out of Scope
- Reworking the dashboard content or data loading
- Redesigning individual widgets beyond theme compatibility
- Server-side theme storage
- Major structural changes to navigation or page layout

## Acceptance Criteria
- [x] The portal loads in light mode by default for new visitors.
- [x] Users can switch to dark mode and keep that preference after refresh.
- [x] The dashboard theme toggle actually changes the visual theme.
- [x] Existing dashboard and orders layouts remain usable in both themes.
- [x] The touched files pass targeted lint verification.
