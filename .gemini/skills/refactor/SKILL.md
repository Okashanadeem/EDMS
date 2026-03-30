---
name: refactor
description: Skill for optimizing and cleaning up EDMS codebase to maintain architectural integrity, reduce technical debt, and ensure modularity without behavioral changes.
---

# 🧹 Skill: Refactoring (EDMS)

## 🎯 Goal
Systematically optimize full-stack code by improving its structure, readability, and performance while strictly maintaining the "Service-Controller-Route" architecture.

## 🔄 Procedural Workflow

### 1. Code Analysis
- Locate "code smells" like redundant logic, prop-drilling in React, or repetitive database queries.
- Identify opportunities for extraction into `utils/` or custom React hooks.

### 2. Implementation Strategy (Plan)
- Create a plan to extract logic into reusable abstractions.
- Ensure the proposed changes do not break existing API contracts or frontend state management.

### 3. Execution (Atomic)
- Move shared logic to appropriate directories (`server/src/utils/` or `client/src/hooks/`).
- Replace old logic with new calls to the abstractions.
- Update all internal imports and dependencies.

### 4. Verification
- Verify that the application still functions as expected.
- Check that `audit_logs` are still triggered and record accurate data.
- Ensure that `auth` and `rbac` guards remain intact.

## ⚠️ Constraints
- **Scope:** Refactor only one module at a time.
- **Naming:** Follow project-specific conventions (camelCase, PascalCase for React components).
- **Integrity:** Never remove audit logging or error handling during refactoring.
- **Behavior:** No new features or bug fixes during a refactor; the behavior must remain identical.
