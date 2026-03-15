# AI Development Workflow

This document defines the **step-by-step operational workflow** for AI agents working in this repository.

All development work must follow this process.

---

# Step 1: Prompt Received

The workflow begins when the developer provides a prompt describing a feature, bug fix, or improvement.

Example:

Add vendor login page.

The agent must **not implement anything at this stage**.

---

# Step 2: Check Active Ticket

The agent must read:

```
/ai-workspace/active-ticket
```

Possible scenarios:

### No Active Ticket

If the file contains:

```
none
```

The agent must create a new ticket.

### Active Ticket Exists

The agent must continue work on the existing ticket.

---

# Step 3: Ticket Creation

The agent creates a ticket inside:

```
/ai-workspace/tickets
```

Format:

```
T-<number>-<description>.md
```

Example:

```
T-001-add-vendor-login-page.md
```

The ticket must include:

* Problem description
* Goal
* Scope
* Acceptance criteria

---

# Step 4: Set Active Ticket

The agent must update:

```
/ai-workspace/active-ticket
```

Example:

```
tickets/T-001-add-vendor-login-page.md
```

---

# Step 5: Implementation Plan

The agent creates an implementation plan.

Location:

```
/ai-workspace/plans
```

Format:

```
P-001-add-vendor-login-page.md
```

The plan must include:

* Implementation strategy
* Step-by-step tasks
* Files expected to change
* Potential risks

---

# Step 6: Wait for Developer Approval

After creating the implementation plan the agent must stop.

The agent must wait for approval messages such as:

```
approved
approve plan
proceed
proceed with implementation
```

Without approval the agent must not implement code.

---

# Step 7: Implementation

After approval the agent performs implementation.

Rules:

* Follow the implementation plan
* Modify only relevant files
* Perform incremental changes

---

# Step 8: Execution Log

After implementation the agent must create an execution log.

Location:

```
/ai-workspace/execution-logs
```

Example:

```
L-001-add-vendor-login-page.md
```

The log must include:

* Steps performed
* Files modified
* Notes about decisions

---

# Step 9: Test Scenario Preparation

The agent must create test scenarios.

Location:

```
/ai-workspace/tests
```

Example:

```
TEST-001-add-vendor-login-page.md
```

The file must include test checklist items.

Example:

```
[ ] Login page renders correctly
[ ] Form validation works
[ ] Successful login redirects to dashboard
```

---

# Step 10: Wait for Test Approval

Before executing tests the agent must ask for developer approval.

Example message:

"I have defined test scenarios in TEST-001. May I proceed with testing?"

---

# Step 11: Execute Tests

After approval the agent runs appropriate tests.

Possible methods:

Dry Run
Vitest
Playwright

The agent must record test results in the test scenario file.

---

# Step 12: Ticket Completion

After successful verification the agent must:

1. Mark the ticket status as COMPLETED
2. Clear `/ai-workspace/active-ticket`
3. Document final notes if necessary

Example active-ticket content:

```
none
```
