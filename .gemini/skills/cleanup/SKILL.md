---
name: cleanup
description: Skill for maintaining the repository's domain-driven structure, removing artifacts, and ensuring code quality in the EDMS project.
---

# 🧹 Skill: File Organization & Cleanup (EDMS)

## 🎯 Goal
Enforce the project's directory structure and code quality standards, ensuring a clean and maintainable repository for all developers and agents.

## 📋 Available Resources
- `GEMINI.md`: Architecture and file structure overview.
- `.gitignore`: Standard project ignore patterns.

## 🔄 Procedural Workflow

### 1. Scanning
- Compare the current project structure against the `GEMINI.md` and `MainDoc.md` repository structure specs.
- Search for `.bak`, `.tmp`, or leftover development artifacts.

### 2. Execution (Atomic)
- Move misplaced files to their correct module directory (e.g., ensuring all Auth logic is in `server/src/modules/auth/`).
- Standardize filenames (e.g., renaming `auth_routes.js` to `auth.routes.js`).
- Prune unused files, empty directories, or dead code.

### 3. Verification
- Confirm that no critical configuration files (like `.env`) were removed.
- Verify that all project imports are updated after moving files.

## ⚠️ Constraints
- **Relocation:** Always update imports when moving a file to prevent breaking changes.
- **Naming:** Strictly follow the pattern `[module].[layer].js` for backend files.
- **Dead Code:** Only remove code that is explicitly unused and has no future phase hooks.
