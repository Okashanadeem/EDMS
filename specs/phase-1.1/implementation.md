# Phase 1.1: Implementation Logs & Decisions

## 📊 Summary (Phase 1.1)
- **Status:** Completed
- **Total Progress:** 100%
- **Milestones Completed:** 7 / 7
- **Tasks Completed:** 39 / 39

## ✅ Completed Features Log
| Date | Feature | Phase | Milestone | Developer | Notes |
|---|---|---|---|---|---|
| 2026-03-31 | Phase 1.1 Planning | 1.1 | 6 | AI Architect | Specs created for Tiptap, OTP, and Draft flows. |
| 2026-03-31 | Schema Evolution | 1.1 | 6 | Senior AI Engineer | Added officer/assistant roles and new columns. |
| 2026-03-31 | Drafts & OTP Backend | 1.1 | 7, 8 | Senior AI Engineer | Implemented Drafts CRUD and OTP verification service. |
| 2026-03-31 | Rich Text & Compose UI | 1.1 | 9 | Senior AI Engineer | Integrated Tiptap; built Compose and Drafts management. |
| 2026-03-31 | Advanced Detail View | 1.1 | 9 | Senior AI Engineer | Added CC/BCC, References, and Redaction logic to UI. |
| 2026-03-31 | Role-Based Dashboards | 1.1 | 9 | Senior AI Engineer | Built functional dashboards for Officers and Assistants. |
| 2026-03-31 | File Preview System | 1.1 | 9 | Senior AI Engineer | Added automatic image/PDF preview in Compose sidebar. |
| 2026-03-31 | API Book & Validation | 1.1 | 10 | AI Architect | Finalized V1.1 API Book and resolved deployment bugs. |
| 2026-04-01 | Pickup Refinement | 1.1 | 11 | Senior AI Engineer | Enforced restrictions on pickup; rebranded 'History' to 'My Documents'. |
| 2026-04-01 | History Restoration | 1.1 | 12 | Senior AI Engineer | Restored department-wide history for collective access. |

## 🛠️ Technical Decisions
| Decision | Rational | Impact |
|---|---|---|
| **Tiptap Editor** | Headless, React-native ProseMirror wrapper. | Extensible, MS-Word style UI. |
| **Server-Side Restriction** | Redaction occurs on the backend before sending to client. | Prevents client-side bypass of 🔒 Restricted docs. |
| **OTP Delegation** | Officer's email acts as the 2nd factor for Assistant dispatch. | Secure, faster routing for busy Officers. |
| **BCC Storage** | Stored in `document_recipients` rather than main `documents` table. | Keeps record clean; allows per-recipient inward numbers. |
| **Blob URL Previews** | Uses `URL.createObjectURL` for instant local file rendering. | Better UX for verifying attachments before dispatch. |

## 🐞 Critical Bug Fixes (Phase 1.1)
- **RBAC Scope Expansion:** Updated `/departments`, `/users`, and `/documents` listing to allow non-admins access for selection/searching.
- **PostgreSQL Enum Block:** Decoupled ENUM value addition from the main transaction block in `update_1.1.sql` to avoid unsafe use errors.
- **Import/Export Resolution:** Fixed `Gemerate number` and `auditLog` function reference errors caused by incorrect destructuring.
- **SQL Quote Sanitization:** Fixed 500 errors caused by double-quoting string literals (e.g., `"draft"`) in service-layer queries.
- **Assistant Workflow Routing:** Corrected `Compose.jsx` to route Assistant submissions through the `/drafts/:id/submit` flow instead of direct dispatch.
