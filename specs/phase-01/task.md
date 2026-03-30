# Phase 01: Detailed Task Breakdown

## 🧩 Milestone 1: Backend Setup & Foundation
0. [x] Initialize PostgreSQL database schema (schema.sql).
0. [x] Seed initial Super Admin user (seed.sql).
1. [x] Create `server/package.json` and install dependencies (Express, PG, JWT, Bcrypt, Dotenv).
2. [x] Write `server/src/config/db.js` for PostgreSQL connection pooling.
3. [ ] Implement `server/src/middleware/auth.js` for JWT verification.
4. [ ] Implement `server/src/middleware/rbac.js` for role-based gating.
5. [ ] Define global error handlers and morgan logging in `server/src/app.js`.

## 🧩 Milestone 2: Identity & Admin Modules
6. [ ] Auth Controller: `/auth/login` (email/password check, return JWT).
7. [ ] Department Module: `GET /departments`, `POST /departments`, `PATCH /departments/:id`, `DELETE /departments/:id`.
8. [ ] User Module: `GET /users`, `POST /users` (with random password generation), `PATCH /users/:id/reset-password`.
9. [ ] Implement `utils/auditLogger.js` to support transactional logging.

## 🧩 Milestone 3: Document Core Routing
10. [ ] Numbering Utility: Atomic `generateNumber` (uses `doc_number_sequences`).
11. [ ] Document Creation: `POST /documents` (uses multipart/form-data, transactions for Doc + Outward Number + Audit Log).
12. [ ] Inbox Query: `GET /documents/inbox` (scoped to worker department, unclaimed docs).
13. [ ] Pickup Logic: `POST /documents/:id/pickup` (UPDATE...WHERE... check, generate Inward Number, transactions).

## 🧩 Milestone 4: Document Lifecycle & Auditing
14. [ ] Processing Logic: `POST /documents/:id/start`, `POST /documents/:id/complete`.
15. [ ] Forwarding Logic: `POST /documents/:id/forward` (new `document_forwards` entry, reset status, new Outward Number, transactions).
16. [ ] Audit Log Module: `GET /audit` (filters by entity, actor, date).

## 🧩 Milestone 5: React Frontend Development
17. [ ] Scaffold `client/` (Vite, Axios, React Router, Tailwind/CSS).
18. [ ] AuthContext: Persist JWT and user profile in memory and localStorage.
19. [ ] Super Admin UI: Manage Departments and Workers (with password modal).
20. [ ] Worker UI: Dashboard (stats), Inbox (Pick up button), Create Doc (Form), My Docs (List).
21. [ ] Document Detail View: Full metadata, audit timeline (vertical component), action buttons.
22. [ ] Integrate 409 Conflict handling for race condition pickups.

## 🏁 Phase Deliverables
- Fully functional Node.js/PostgreSQL backend API.
- Role-based React dashboards with protected routing.
- End-to-end document lifecycle from creation to completion.
- Complete audit trail accessible by Super Admin.
