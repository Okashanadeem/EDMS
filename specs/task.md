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

### 🧩 Milestone 5: Audit & Validation
- [x] Audit Logger Utility: Transactional writes
- [x] Audit Module: View all logs (Super Admin only)
- [x] Document Detail: Integrated audit timeline view
- [x] Final end-to-end workflow validation

---

## 🛠️ Phase 2: Enhanced Capabilities (Planned)
- [ ] S3 Storage provider implementation
- [ ] Full-text search activación (using GIN indexes)
- [ ] OCR Background worker and results table
- [ ] Legacy data import migration tool
