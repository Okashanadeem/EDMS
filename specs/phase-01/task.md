# Phase 01: Detailed Task Breakdown

## 🧩 Milestone 1: Backend Setup & Foundation
0. [x] Initialize PostgreSQL database schema (schema.sql).
0. [x] Seed initial Super Admin user (seed.sql).
1. [x] Create `server/package.json` and install dependencies (Express, PG, JWT, Bcrypt, Dotenv).
2. [x] Write `server/src/config/db.js` for PostgreSQL connection pooling.
3. [x] Implement `server/src/middleware/auth.js` for JWT verification.
4. [x] Implement `server/src/middleware/rbac.js` for role-based gating.
5. [x] Define global error handlers and morgan logging in `server/src/app.js`.

## 🧩 Milestone 2: Identity & Admin Modules
6. [x] Auth Controller: `/auth/login` (email/password check, return JWT).
7. [x] Department Module: `GET /departments`, `POST /departments`, `PATCH /departments/:id`, `DELETE /departments/:id`.
8. [x] User Module: `GET /users`, `POST /users` (with random password generation), `PATCH /users/:id/reset-password`.
9. [x] Implement `utils/auditLogger.js` to support transactional logging.

## 🧩 Milestone 3: Document Core Routing
10. [x] Numbering Utility: Atomic `generateNumber` (uses `doc_number_sequences`).
11. [x] Document Creation: `POST /documents` (uses multipart/form-data, transactions for Doc + Outward Number + Audit Log).
12. [x] Inbox Query: `GET /documents/inbox` (scoped to worker department, unclaimed docs).
13. [x] Pickup Logic: `POST /documents/:id/pickup` (UPDATE...WHERE... check, generate Inward Number, transactions).

## 🧩 Milestone 4: Document Lifecycle & Auditing
14. [x] Processing Logic: `POST /documents/:id/start`, `POST /documents/:id/complete`.
15. [x] Forwarding Logic: `POST /documents/:id/forward` (new `document_forwards` entry, reset status, new Outward Number, transactions).
16. [x] Audit Log Module: `GET /audit` (filters by entity, actor, date).

## 🧩 Milestone 5: React Frontend Development
17. [x] Scaffold `client/` (Vite, Axios, React Router, Tailwind/CSS).
18. [x] AuthContext: Persist JWT and user profile in memory and localStorage.
19. [x] Super Admin UI: Manage Departments and Workers (with password modal).
20. [x] Worker UI: Dashboard (stats), Inbox (Pick up button), Create Doc (Form), My Docs (List).
21. [x] Document Detail View: Full metadata, audit timeline (vertical component), action buttons.
22. [x] Integrate 409 Conflict handling for race condition pickups.
23. [x] Implement Super Admin and Worker layouts with role-gated navigation.
24. [x] UI Enhancement: Add "View Workers" action in Department list (redirects to Users page with filter).
25. [x] UI Enhancement: Implement department dropdown filter on User Management page.
26. [x] Visual API Book: Create `Doc/V1.0/API_BOOK.md` with visual request/reponse examples.
27. [x] Testing Utility: Implement `POST /api/v1/test/cleanup` to delete specific or all users/documents (Internal use only).
28. [x] Self-Service: Implement `PATCH /auth/change-password` backend logic.
29. [x] UI Enhancement: Add "Change Password" modal accessible from all layouts.

## 🏁 Phase Deliverables
- Fully functional Node.js/PostgreSQL backend API.
- Role-based React dashboards with protected routing.
- End-to-end document lifecycle from creation to completion.
- Complete audit trail accessible by Super Admin.
