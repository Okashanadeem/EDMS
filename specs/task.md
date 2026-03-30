# EDMS Master Task List

## 🚀 Phase 1: MVP Implementation (Current)

### 🧩 Milestone 1: Foundation & Backend
- [x] Initialize PostgreSQL database schema (schema.sql)
- [x] Seed initial Super Admin user (seed.sql)
- [ ] Implement database connection pool (db.js)
- [ ] Configure environment variables (.env stubs)
- [ ] Implementation of `auth` and `rbac` middlewares

### 🧩 Milestone 2: Identity & Access Management
- [ ] Auth Module: Login endpoint (`/auth/login`)
- [ ] Auth Module: JWT token generation and validation
- [ ] User Module: CRUD for workers (Super Admin only)
- [ ] User Module: Random password generation and one-time display logic
- [ ] Department Module: CRUD for departments (Super Admin only)

### 🧩 Milestone 3: Core Document Workflow
- [ ] Numbering Utility: Inward/Outward atomic generator
- [ ] Document Module: Create and Dispatch (`POST /documents`)
- [ ] Document Module: Department Inbox query (`GET /documents/inbox`)
- [ ] Document Module: Atomic Pickup logic (`POST /documents/:id/pickup`)
- [ ] Document Module: Document Forwarding with new outward numbers
- [ ] Document Module: Processing (Start, Complete)

### 🧩 Milestone 4: Frontend Development
- [ ] Vite React setup with Axios interceptors
- [ ] AuthContext and Protected Routes for role-gating
- [ ] Super Admin Layout: Dashboard, Depts, Users, All Docs, Audit Log
- [ ] Worker Layout: Dashboard, Inbox, My Docs, Create, Detail View
- [ ] Document Action UI: Context-sensitive buttons per status
- [ ] Pick-up race condition handler (409 Conflict toast)

### 🧩 Milestone 5: Audit & Validation
- [ ] Audit Logger Utility: Transactional writes
- [ ] Audit Module: View all logs (Super Admin only)
- [ ] Document Detail: Integrated audit timeline view
- [ ] Final end-to-end workflow validation

---

## 🛠️ Phase 2: Enhanced Capabilities (Planned)
- [ ] S3 Storage provider implementation
- [ ] Full-text search activación (using GIN indexes)
- [ ] OCR Background worker and results table
- [ ] Legacy data import migration tool
