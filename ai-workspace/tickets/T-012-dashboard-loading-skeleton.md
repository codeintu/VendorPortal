# Ticket: T-012-dashboard-loading-skeleton

Status: CLOSED
Created: 2026-03-18
Author: AI Agent

## Problem Statement
The dashboard currently shows a few real-looking static blocks while the vendor summary is still loading on first login. That makes the page feel unfinished and visually inconsistent with the rest of the portal.

## Goal
Replace the current first-load placeholder behavior with a polished dashboard skeleton that mirrors the real dashboard layout and feels like content is actively loading.

## Scope
1. Add a dashboard loading skeleton for the first vendor summary load.
2. Make the skeleton visually match the existing dashboard structure.
3. Keep the skeleton consistent with the portal's dark theme.
4. Preserve the current shared dashboard data flow and route switching behavior.

## Out of Scope
- FileMaker query changes
- Auth/session changes
- Orders table redesign
- New dashboard features or metrics

## Acceptance Criteria
- [x] First-time dashboard load shows a polished skeleton instead of static metric cards.
- [x] The skeleton resembles the actual dashboard layout, including summary cards, company profile, and recent orders section.
- [x] The loading state fits the current dark UI theme.
- [x] Switching between dashboard routes still avoids unnecessary full-page reload behavior.
- [x] The touched files pass targeted lint verification.
