---
name: doc-gen
description: Skill for maintaining and updating EDMS project documentation, including MainDoc.md, JSDoc, and READMEs, ensuring alignment with current implementation.
---

# 📚 Skill: Documentation Generation (EDMS)

## 🎯 Goal
Keep the EDMS documentation (Phase 1 MVP) in sync with the actual implementation across the database schema, API, and frontend.

## 🔄 Procedural Workflow

### 1. Discovery
- Scan the repository for recent changes in `schema.sql`, route definitions, or module structure.
- Identify functions or components lacking JSDoc or outdated descriptions.

### 2. Implementation
- **JSDoc:** Add or update JSDoc blocks for all exported functions in the `server` and `client` directories.
- **Schema Update:** If `schema.sql` changed, update the documentation in `Doc/V1.0/MainDoc.md` section 4.
- **API Reference:** Update Section 6 of `MainDoc.md` for new or modified endpoints.

### 3. Verification
- Verify that the documentation is technically accurate and follows the high-signal standard.
- Ensure that `GEMINI.md` reflects the latest system architecture and execution flow.

## ⚠️ Constraints
- **Accuracy:** Never document non-existent features or "TODOs".
- **Formatting:** Use standard Markdown with proper tables and headers.
- **Detail:** Ensure that all document states (`in_transit`, `picked_up`, etc.) and roles (`super_admin`, `worker`) are consistently defined.
