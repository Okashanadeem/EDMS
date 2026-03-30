# Electronic Document Management System (EDMS) | AI Governance

This document defines the operational framework and architectural alignment for AI agents (Gemini CLI) interacting with the EDMS project.

## 🏗️ System Architecture
The EDMS is a centralized digital workflow system for police department correspondence.
- **Frontend:** React.js (Vite) - Role-based dashboards (Super Admin, Worker).
- **Backend:** Node.js (Express.js) - RESTful API, JWT auth, RBAC middleware.
- **Database:** PostgreSQL - 8-table relational schema with audit logging.
- **Storage:** Local file system (`/uploads`), abstraction prepared for S3.

## 🔄 Execution Flow
All tasks must follow this lifecycle:
1. **Context Discovery:** Read `memory/constitution.md` and `GEMINI.md` before any action.
2. **Work Initialization:** Create a task-specific git branch (e.g., `feat/`, `fix/`) BEFORE starting development.
3. **Strategy Formulation:** Use `enter_plan_mode` for architectural changes or multi-step features.
4. **Skill Activation:** Invoke `activate_skill` based on the intent of the task (e.g., Code Gen, Debug).
5. **Atomic Achievements:** Commit and push changes to the remote repository after every verifiable milestone.
6. **Validation:** Run linting, type-checks, and tests after every modification.

## ⚡ Skill Activation Strategy
Skills are stored in `.gemini/skills/` and are triggered via the `activate_skill` tool based on their descriptions:
- **`code-gen`**: Triggers for full-stack component creation (Routes, Controllers, Services, UI).
- **`refactor`**: Triggers for code optimization and structural cleanup.
- **`debug`**: Triggers for resolving full-stack errors and transaction failures.
- **`doc-gen`**: Triggers for updating MainDoc.md or JSDoc alignment.
- **`cleanup`**: Triggers for repository structure enforcement and pruning.

## 🛠️ Command Conventions
- **Git:** Initialize every task with a new branch. Use clear, "why"-focused messages. Commit and push after each achievement success.
- **npm:** Use `--silent` to reduce noise. Verify dependencies before installation.
- **SQL:** Always use transactions for document operations as per Phase 1 spec.

## 📁 File Structure Overview
- `server/src/modules/`: Domain-driven module structure (Auth, Docs, Depts).
- `client/src/pages/`: Role-gated React components.
- `Doc/V1.0/`: Source of truth for business logic and schema.

## ⚠️ Edge Cases & Failure Handling
- **Race Conditions:** Document "Pick Up" must use atomic PostgreSQL `UPDATE...WHERE assigned_to IS NULL`.
- **RBAC Violations:** Always verify `req.user.role` on the server; never trust the client.
- **Audit Gaps:** Every document state change must have a corresponding entry in `audit_logs` within the same transaction.

## 🚀 Maintainability Standards
- **DRY:** Use `utils/numbering.js` and `utils/auditLogger.js` for all document operations.
- **Types:** Strictly adhere to `user_role` and `doc_status` enums defined in `schema.sql`.
- **Logs:** Ensure metadata snapshots are stored as JSONB for event reconstruction.
