---
name: debug
description: Skill for identifying and resolving full-stack issues in the EDMS project, from PostgreSQL transaction failures to React state-management errors.
---

# 🐞 Skill: Debugging (EDMS)

## 🎯 Goal
Rapidly identify, reproduce, and resolve defects across the database, API, and UI layers of the EDMS system.

## 🔄 Procedural Workflow

### 1. Reproduction & Diagnosis
- Create a minimal script or sequence of actions to reproduce the reported bug.
- Isolate the error: check database integrity, API response codes, and frontend console logs.

### 2. Root Cause Analysis
- Inspect `server` logs (morgan, console) for stack traces or SQL errors.
- Review recent `audit_logs` to identify data state inconsistencies.
- Verify JWT expiration if authentication issues are present.

### 3. Implementation of Fix
- Apply the minimal code change required to resolve the issue.
- Ensure the fix doesn't introduce regressions or bypass RBAC controls.

### 4. Verification & Testing
- Re-run the reproduction steps to confirm the fix.
- Test related modules (e.g., if a document "Pick Up" bug is fixed, check "Forward" and "Complete" logic).

## ⚠️ Constraints
- **Transactions:** If a document operation fails, verify that the transaction correctly rolls back.
- **Security:** Do not "patch" around schema-level or security constraints. Fix the root cause in the data flow.
- **Auditing:** Ensure that the fix includes proper audit logging for the corrected action.
