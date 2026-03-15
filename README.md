# Vendor Portal Frontend

React + Vite

---

# 1. Project Overview

This project uses a **controlled AI-assisted development workflow**.

AI agents do not directly modify the codebase from prompts.
All work must pass through a structured workflow that ensures:

* Traceability
* Approval gates
* Test verification
* Safe and incremental code changes

All AI workflow artifacts are stored inside:

```
/ai-workspace
```

The AI agent must strictly follow:

```
.agents/rules/rules.md
.agents/workflow/workflow.md
```

If there is any conflict between instructions, **rules.md takes precedence**.

---

# 2. Core Development Workflow

All development tasks must follow the workflow below.

```
User Prompt
↓
Ticket Creation
↓
Implementation Plan
↓
WAIT FOR DEVELOPER APPROVAL
↓
Step-by-Step Execution
↓
Execution Log Update
↓
Verification
↓
Prepare Test Case File
↓
WAIT FOR TEST APPROVAL
↓
Run Tests
↓
Ticket Completion
```

### Critical Rule

The AI agent **must never implement code directly from a prompt**.

A ticket and implementation plan **must always be created first**.

---

# 3. Plan Approval Requirement

After generating an implementation plan, the agent **must stop execution** and wait for developer approval.

Execution may begin **only after explicit developer approval**.

Accepted approval responses:

```
approved
approve plan
proceed
proceed with implementation
```

If approval is not given, the agent must wait for clarification or requested changes.

---

# 4. AI Workspace Structure

All workflow artifacts are stored in:

```
/ai-workspace
```

Structure:

```
/ai-workspace

    /docs
        coding-guidelines.md
        frontend-architecture.md
        api-contract.md
        state-management.md

    /tickets
        T-001-add-user-phone-number.md

    /plans
        P-001-add-user-phone-number.md

    /execution-logs
        L-001-add-user-phone-number.md

    /tests
        TEST-001-add-user-phone-number.md

    /e2e
        T-001-*.spec.ts

    /tests/unit
        T-001-*.test.ts

    /sql
        001_add_user_phone_number.sql

    active-ticket
```

---

# 5. Ticket Template

All tickets must follow this structure.

```
# Ticket: T-XXX-description

Status: OPEN
Created: YYYY-MM-DD
Author: AI Agent

## Problem
Describe the issue or missing feature.

## Goal
What outcome should be achieved.

## Scope
List of expected changes.

## Out of Scope
Explicitly mention what should NOT be modified.

## Affected Areas
Files, modules, or systems expected to change.

## Risks
Low / Medium / High

## Acceptance Criteria

- Requirement 1
- Requirement 2
- Requirement 3
```

---

# 6. Implementation Plan Template

Implementation plans must contain **clear execution steps**.

```
# Plan: P-XXX-description

Linked Ticket: T-XXX-description

## Strategy
High level approach for implementing the feature.

## Implementation Steps

1. Identify existing components
2. Create new UI component
3. Update service layer
4. Add validations
5. Update tests

## Files Expected To Change

- src/components/Example.tsx
- src/services/userService.ts

## Risks
Potential side effects or dependencies.

## Rollback Plan
How the change can be reverted safely.
```

---

# 7. Execution Log Template

Execution logs track the actual work performed.

```
# Execution Log: L-XXX-description

Ticket: T-XXX-description

## Steps Performed

1. Created component
2. Updated service layer
3. Added validation

## Files Modified

- src/components/ProfileForm.tsx
- src/services/userService.ts

## Notes

Any implementation details worth documenting.
```

---

# 8. File Naming Conventions

### Tickets

```
T-<number>-<description>.md
```

Examples:

```
T-001-add-user-phone-number.md
T-002-fix-login-validation.md
```

Allowed prefixes:

```
add
fix
update
remove
refactor
```

---

### Plans

```
P-<number>-<description>.md
```

Example:

```
P-001-add-user-phone-number.md
```

---

### Execution Logs

```
L-<number>-<description>.md
```

Example:

```
L-001-add-user-phone-number.md
```

---

### Tests

```
TEST-<number>-<description>.md
```

Example:

```
TEST-001-add-user-phone-number.md
```

---

### SQL Scripts

```
<number>_<description>.sql
```

Example:

```
001_add_user_phone_number.sql
```

---

# 9. Active Ticket Management

The repository maintains the currently active ticket using:

```
/ai-workspace/active-ticket
```

Example content:

```
tickets/T-001-add-user-phone-number.md
```

Rules:

* Only **one ticket may be active**
* The agent must read the active ticket before implementation
* When a ticket is completed, its status must change to **COMPLETED**
* The agent must **never work on multiple tickets simultaneously**

---

# 10. Frontend Project Structure

Application source code lives inside:

```
src
```

Recommended structure:

```
src
 ├─ assets
 ├─ components
 ├─ layouts
 ├─ pages
 ├─ hooks
 ├─ context
 ├─ services
 ├─ types
 ├─ utils
 ├─ config
 ├─ App.tsx
 ├─ main.tsx
 ├─ index.css
 ├─ theme.ts
 └─ vite-env.d.ts
```

---

# 11. Application Entry Points

Application bootstrap:

```
src/main.tsx
```

Root component:

```
src/App.tsx
```

---

# 12. Development Setup

Install dependencies:

```
npm install
```

Start development server:

```
npm run dev
```

Build production bundle:

```
npm run build
```

---

# 13. Testing Procedures

Every ticket requires a **formal verification process**.

### Step 1 — Test Scenario Documentation

Create a checklist in:

```
/ai-workspace/tests/TEST-<number>-<description>.md
```

Example:

```
[ ] Scenario A: UI renders correctly
[ ] Scenario B: Logic returns expected results
```

---

### Step 2 — Test Method Selection

The agent must propose the most appropriate testing method.

1. Dry Run
2. Vitest (Unit Tests)
3. Playwright (E2E Tests)

---

### Step 3 — Approval Flow

1. Document test scenarios
2. Request developer approval
3. Run tests after approval
4. Update test scenario file with results

---

### Important Commands

Vitest:

```
npx vitest run
```

Playwright:

```
npx playwright test
```

---

# 14. Artifact and Git Policy

Test artifacts must **never be committed**.

Add to `.gitignore`:

```
test-results/
playwright-report/
```

Only test scripts and scenario documentation should be committed.

---

# 15. Execution Safety Principles

The AI agent must follow these safety rules.

* Prefer small and safe changes
* Avoid modifying unrelated modules
* Do not refactor outside ticket scope
* Maintain backward compatibility unless instructed
* Verify repository state before implementing
* Never assume file existence without checking
* Never execute implementation plans without approval
* Stop and request clarification if instructions are unclear

---

# 16. AI Agent Guardrails

The AI agent **must not perform the following actions** unless explicitly instructed.

```
Modify package.json dependencies
Change environment configuration
Modify authentication logic
Change database schema without SQL migration
Delete files outside ticket scope
Refactor unrelated modules
```

If such changes are required, the agent must **create a separate ticket**.

---

# 17. Definition of Done

A ticket may be marked **COMPLETED** only when:

* Implementation is finished
* Execution log is updated
* Test scenarios documented
* Tests executed and passed
* Code compiles without errors
* No unrelated files modified

```
```
