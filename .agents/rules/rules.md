---
trigger: always_on
---

# AI Agent Rules

These rules define the **operational boundaries and safety requirements** for AI agents working in this repository.

The agent must always follow these rules when performing any task.

If there is any conflict between instructions, **these rules take precedence**.

---

# 1. Workflow Compliance

The AI agent **must strictly follow the defined development workflow**.

Required sequence:

Prompt
→ Ticket Creation
→ Implementation Plan
→ Wait for Developer Approval
→ Step-by-Step Execution
→ Execution Log Update
→ Test Scenario Preparation
→ Wait for Test Approval
→ Run Tests
→ Ticket Completion

The agent must **never skip any step**.

---

# 2. No Direct Code Implementation

The agent must **never implement code directly from a prompt**.

Before modifying any code the agent must:

1. Create a ticket
2. Create an implementation plan
3. Wait for developer approval

Only after approval may the agent begin implementation.

---

# 3. Single Active Ticket Rule

The repository supports **only one active ticket at a time**.

The agent must:

1. Read `/ai-workspace/active-ticket`
2. Confirm the currently active ticket
3. Work only on that ticket

The agent must **never work on multiple tickets simultaneously**.

---

# 4. Scope Control

The agent must only modify files related to the active ticket.

The agent must NOT:

* Modify unrelated files
* Refactor unrelated modules
* Perform large architectural changes
* Modify external dependencies

If additional work is required outside the ticket scope, the agent must:

1. Stop execution
2. Create a new ticket proposal
3. Request developer approval

---

# 5. Safe Code Changes

The agent must prioritize **small and safe code changes**.

Rules:

* Avoid unnecessary refactoring
* Avoid modifying multiple modules unless required
* Prefer incremental updates
* Maintain backward compatibility unless explicitly instructed

---

# 6. File Verification

Before reading or modifying any file the agent must:

1. Verify that the file exists
2. Confirm the correct path
3. Avoid assumptions about project structure

If a file does not exist, the agent must create it **only if required by the implementation plan**.

---

# 7. Restricted Operations

The agent must not perform the following actions unless explicitly instructed:

* Modify `package.json` dependencies
* Change environment configuration
* Modify authentication architecture
* Modify database schema without SQL migration
* Delete files outside the ticket scope
* Run destructive commands

If such changes are required, the agent must create a **separate ticket**.

---

# 8. Documentation Awareness

The agent must consult documentation before implementing changes.

Relevant documentation:

```
/ai-workspace/docs/coding-guidelines.md
/ai-workspace/docs/frontend-architecture.md
/ai-workspace/docs/api-contract.md
/ai-workspace/docs/state-management.md
```

If documentation is missing or incomplete, the agent should request clarification.

---

# 9. Execution Logging

Every implementation must be recorded in an execution log.

Location:

```
/ai-workspace/execution-logs
```

Logs must include:

* Steps performed
* Files modified
* Notes about implementation decisions

---

# 10. Testing Requirement

Every ticket must include a verification process.

The agent must:

1. Prepare test scenarios
2. Wait for developer approval
3. Execute tests
4. Record results

Testing may use:

* Dry Run
* Vitest
* Playwright

---

# 11. Handling Uncertainty

If instructions are unclear or ambiguous the agent must:

1. Stop execution
2. Request clarification
3. Wait for developer response

The agent must **never guess implementation details**.

---

# 12. Definition of Done

A ticket may be marked **COMPLETED** only when:

* Implementation is finished
* Execution log is updated
* Test scenarios documented
* Tests executed and passed
* No unrelated files modified
* Code compiles successfully