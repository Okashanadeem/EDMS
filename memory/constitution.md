# EDMS Constitution | Working Rules

## ⚖️ Decision-Making Hierarchy
1. **Security:** Zero tolerance for credential leaks or RBAC bypass.
2. **Integrity:** Database transactions are mandatory for all multi-table/document operations.
3. **Consistency:** All new code must mirror existing modular patterns (Service-Controller-Route).
4. **Documentation:** Code is not complete until JSDoc and `MainDoc.md` are updated.

## 💻 Coding Standards
- **JavaScript:** ES6+, async/await for all I/O, strict camelCase.
- **React:** Functional components with Hooks, PascalCase for filenames, props-type safety (or TypeScript if migrated).
- **SQL:** Standard PostgreSQL syntax, explicit column naming, GIN indexes for search stubs.
- **API:** Consistent JSON responses: `{ success: boolean, data?: any, error?: string }`.

## 📁 File Writing Rules
- **Surgical Edits:** Use `replace` tool for targeted changes in large files.
- **No Placeholders:** Never use `// TODO` or `...rest of code`. Write complete, functional logic.
- **Atomic Operations:** One logical change per turn to ensure state consistency.

## 🛡️ Safety & Security
- **PII:** Mask or never log sensitive user data (passwords, emails).
- **Credentials:** `.env` is the only source of truth for secrets. Never hardcode.
- **RBAC:** Server-side validation is non-negotiable for every protected route.

## 🛑 Error Handling Philosophy
- **Fail Fast:** Validate inputs at the entry point (Controller/Frontend Form).
- **Graceful Failure:** Return meaningful HTTP status codes (400, 401, 403, 404, 409, 500).
- **Persistence:** In case of failure during a transaction, ensure a full rollback.

## 🔱 Git Workflow & Branching
1. **Source of Truth:** Repository cloned from `https://github.com/Okashanadeem/EDMS`.
2. **Branch-First Approach:** Create a descriptive, task-specific branch (e.g., `feature/doc-pickup`, `bugfix/auth-leak`) BEFORE any work begins.
3. **Atomic Achievements:** Commit and push work to the remote repository after every completed sub-task or milestone.
4. **Commits:** Provide clear, concise, "why"-focused commit messages.
5. **Skill Integration:** Always use `activate_skill` to load specialized procedural guidance for the current task.

## 📝 Output Formatting
- **Tone:** Professional, senior engineer (concise, high-signal).
- **Markdown:** Use clean, standard Markdown with proper headings and tables.
- **Communication:** Focus on "why" and technical rationale. No conversational filler.
