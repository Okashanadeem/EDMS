# EDMS Master Task List

## 🚀 Phase 1: MVP Implementation (Current)

### 🧩 Milestone 1: Foundation & Backend
- [x] Initialize PostgreSQL database schema (schema.sql)
- [x] Seed initial Super Admin user (seed.sql)
- [x] Implement database connection pool (db.js)
- [x] Configure environment variables (.env stubs)
- [x] Implementation of `auth` and `rbac` middlewares

### 🧩 Milestone 2: Identity & Access Management
- [x] Auth Module: Login endpoint (`/auth/login`)
- [x] Auth Module: JWT token generation and validation
- [x] User Module: CRUD for workers (Super Admin only)
- [x] User Module: Random password generation and one-time display logic
- [x] Department Module: CRUD for departments (Super Admin only)

### 🧩 Milestone 3: Core Document Workflow
- [x] Numbering Utility: Inward/Outward atomic generator
- [x] Document Module: Create and Dispatch (`POST /documents`)
- [x] Document Module: Department Inbox query (`GET /documents/inbox`)
- [x] Document Module: Atomic Pickup logic (`POST /documents/:id/pickup`)
- [x] Document Module: Document Forwarding with new outward numbers
- [x] Document Module: Processing (Start, Complete)

### 🧩 Milestone 4: Frontend Development
- [x] Vite React setup with Axios interceptors
- [x] AuthContext and Protected Routes for role-gating
- [x] Super Admin Layout: Dashboard, Depts, Users, All Docs, Audit Log
- [x] Worker Layout: Dashboard, Inbox, My Docs, Create, Detail View
- [x] Document Action UI: Context-sensitive buttons per status
- [x] Pick-up race condition handler (409 Conflict toast)
- [x] UI Enhancement: Department-to-Worker navigation and filtering on Users page
- [x] Visual API Book (Internal documentation)
- [x] Internal Testing API (Cleanup utilities)
- [x] Self-Service "Change Password" for all users

### 🧩 Milestone 5: Audit & Validation
- [x] Audit Logger Utility: Transactional writes
- [x] Audit Module: View all logs (Super Admin only)
- [x] Document Detail: Integrated audit timeline view
- [x] Final end-to-end workflow validation

---

## 🚀 Phase 1.1: Extended Correspondence - ✅ **Completed**

### 🧩 Milestone 6: Identity & Schema Evolution
- [x] Update `user_role` and `doc_status` enums
- [x] Add `officer_id` and `can_send_on_behalf` to users
- [x] Add `body_html` and draft/restriction columns to documents
- [x] Create `document_recipients`, `document_references`, and `document_otps` tables
- [x] Update Users module for assistant-officer linking

### 🧩 Milestone 7: Draft & Compose Backend
- [x] Implement Drafts Module CRUD
- [x] Support rich-text, CC, BCC, and references in document dispatch
- [x] Server-side document restriction enforcement
- [x] Multi-destination inward/outward numbering

### 🧩 Milestone 8: Officer-Assistant Review & OTP
- [x] Assistant draft submission to Officer
- [x] Officer Approve / Request Revision logic
- [x] OTP Service (Generate, Hash, TTL, Mailer)
- [x] OTP-delegated dispatch (request and verify)

### 🧩 Milestone 9: Frontend Modernization
- [x] Officer and Assistant layouts
- [x] Tiptap RichTextEditor component
- [x] Word-style Compose page and Draft Management UI
- [x] Officer Review Panel and Assistant OTP Modal
- [x] Restriction, Reference, and CC/BCC selectors

### 🧩 Milestone 10: Validation & Governance (Phase 1.1)
- [x] E2E testing of review and OTP workflows
- [x] Restriction access verification
- [x] Visual API Book update (v1.1)

---

## 🚀 Phase 1.2: Digital Signatures & PDF Engine (In Progress)

### 🧩 Milestone 11: Signature Management
- [ ] Database: Add `signature_path` to `users` table.
- [ ] Backend: Signature Upload API with `multer`.
- [ ] Backend: Image Processing Service (Background removal & normalization).
- [ ] Frontend: Signature Upload & Preview UI in User Management (Super Admin).
- [ ] Frontend: Officer Dashboard "Update Signature" component.

### 🧩 Milestone 12: Official Document Engine (PDF)
- [ ] Backend: HTML-to-PDF Generation Service.
- [ ] Backend: POV-aware PDF Download endpoint (`GET /documents/:id/pdf`).
- [ ] Backend: Signature stamping logic for delegated dispatches.
- [ ] Frontend: "Download Official Letter" button in Document Detail.
- [ ] UI: Official Letterhead & Layout Design.

---

## 🛠️ Phase 2: Enhanced Capabilities (Planned)
- [ ] S3 Storage provider implementation
- [ ] Full-text search activación (using GIN indexes)
- [ ] OCR Background worker and results table
- [ ] Legacy data import migration tool
