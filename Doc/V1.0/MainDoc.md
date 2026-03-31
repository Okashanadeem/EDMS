# Electronic Document Management System (EDMS)
## Claude Code Project Documentation — Phase 1 MVP

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Repository Structure](#3-repository-structure)
4. [Database Schema](#4-database-schema)
5. [Backend Architecture](#5-backend-architecture)
6. [API Reference](#6-api-reference)
7. [Frontend Architecture](#7-frontend-architecture)
8. [Role-Based Access Control](#8-role-based-access-control)
9. [Document Workflow Logic](#9-document-workflow-logic)
10. [Audit Logging](#10-audit-logging)
11. [Environment Configuration](#11-environment-configuration)
12. [Build & Run Instructions](#12-build--run-instructions)
13. [Phase 2 Hooks](#13-phase-2-hooks)
14. [Project Governance & Implementation Logs](#14-project-governance--implementation-logs)

---

## 1. Project Overview

### Purpose

The EDMS replaces a paper-based dak (correspondence) process and informal channels (WhatsApp, email) with a centralized, role-controlled, fully traceable digital workflow for a police department.

### Roles

The system has exactly **two roles**:

| Role | Description |
|---|---|
| `super_admin` | Manages the entire system — departments, users, documents, and audit logs. |
| `worker` | Belongs to a department. Creates, picks up, processes, forwards, and completes documents. |

> **There is no Department Admin role.** All administrative responsibilities previously associated with a department admin are handled entirely by the Super Admin.

### Goals for Phase 1 MVP

- Replace physical routing with digital document transfers between departments.
- Provide role-based dashboards for Super Admin and Worker.
- Super Admin creates departments and workers, then credentials are automatically emailed to the worker.
- Workers independently pick up documents from their department inbox — no assignment by an admin occurs. The first worker to pick a document becomes its owner.
- Auto-generate department-wise inward/outward document numbers.
- Maintain a full audit log of every document action.
- **Automated Communication:** Send system-generated credentials and password resets to users via Node Mailer.
- **Self-Service Security:** Allow all users (Admin/Worker) to change their own passwords.

### Success Criteria

1. Super Admin can create a department and a worker account.
2. Worker can create a document and dispatch it to another department.
3. Worker in the target department can see the document in their inbox and pick it up.
4. All actions generate corresponding audit log entries with metadata.
5. Frontend UI reflects document status changes in real-time.
6. Race conditions during document "pickup" are handled correctly by the database (atomic logic).

### Out of Scope (Phase 1)

- Legacy data migration
- OCR / full-text search
- External integrations

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js (Vite) |
| Backend | Node.js + Express.js |
| Database | PostgreSQL |
| Authentication | JWT (access token) |
| File Storage | Local disk (`/uploads`) — swappable for S3 in Phase 2 |
| Audit Logging | Application-level `audit_logs` table in PostgreSQL |

---

## 3. Repository Structure

```
edms/
├── server/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                  # PostgreSQL connection pool
│   │   ├── middleware/
│   │   │   ├── auth.js                # JWT verification middleware
│   │   │   └── rbac.js                # Role-based access guard
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   │   ├── auth.routes.js
│   │   │   │   ├── auth.controller.js
│   │   │   │   └── auth.service.js
│   │   │   ├── departments/
│   │   │   │   ├── departments.routes.js
│   │   │   │   ├── departments.controller.js
│   │   │   │   └── departments.service.js
│   │   │   ├── users/
│   │   │   │   ├── users.routes.js
│   │   │   │   ├── users.controller.js
│   │   │   │   └── users.service.js
│   │   │   ├── documents/
│   │   │   │   ├── documents.routes.js
│   │   │   │   ├── documents.controller.js
│   │   │   │   └── documents.service.js
│   │   │   └── audit/
│   │   │       ├── audit.routes.js
│   │   │       ├── audit.controller.js
│   │   │       └── audit.service.js
│   │   ├── utils/
│   │   │   ├── numbering.js           # Inward/outward number generator
│   │   │   ├── auditLogger.js         # Reusable audit write helper
│   │   │   └── storage.js             # File I/O abstraction
│   │   └── app.js                     # Express app setup
│   ├── uploads/                       # Local file storage
│   ├── sql/
│   │   ├── schema.sql                 # All CREATE TABLE statements
│   │   └── seed.sql                   # Initial super admin user
│   ├── .env
│   └── package.json
│
└── client/
    ├── src/
    │   ├── api/
    │   │   └── axios.js               # Axios instance with JWT interceptor
    │   ├── context/
    │   │   └── AuthContext.jsx        # Global auth state
    │   ├── layouts/
    │   │   ├── SuperAdminLayout.jsx
    │   │   └── WorkerLayout.jsx
    │   ├── pages/
    │   │   ├── super-admin/
    │   │   │   ├── SystemDashboard.jsx
    │   │   │   ├── Departments.jsx
    │   │   │   ├── UserManagement.jsx
    │   │   │   ├── AllDocuments.jsx
    │   │   │   └── AuditLog.jsx
    │   │   └── worker/
    │   │       ├── WorkerDashboard.jsx
    │   │       ├── CreateDocument.jsx
    │   │       ├── DeptInbox.jsx
    │   │       ├── MyDocuments.jsx
    │   │       └── DocumentDetail.jsx
    │   ├── components/
    │   │   ├── DocumentCard.jsx
    │   │   ├── AuditTimeline.jsx
    │   │   ├── StatusBadge.jsx
    │   │   ├── ProtectedRoute.jsx
    │   │   └── ChangePasswordModal.jsx
    │   └── App.jsx
    ├── .env
    └── package.json
```

---

## 4. Database Schema

Run these SQL statements in order to initialize the database.

### 4.1 Departments

```sql
CREATE TABLE departments (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(255) NOT NULL UNIQUE,
  code        VARCHAR(50)  NOT NULL UNIQUE,   -- Short code used in numbering, e.g. "CID"
  is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
```

### 4.2 Users

There are only two roles. `super_admin` users have `department_id = NULL`. All other users are `worker` and must belong to a department.

```sql
CREATE TYPE user_role AS ENUM ('super_admin', 'worker');

CREATE TABLE users (
  id              SERIAL PRIMARY KEY,
  name            VARCHAR(255)  NOT NULL,
  email           VARCHAR(255)  NOT NULL UNIQUE,
  password_hash   TEXT          NOT NULL,
  role            user_role     NOT NULL,
  department_id   INT           REFERENCES departments(id) ON DELETE SET NULL,
  is_active       BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT worker_must_have_department
    CHECK (role = 'super_admin' OR department_id IS NOT NULL)
);
```

### 4.3 Documents

The `assigned_to` column is set when a worker picks up a document from the inbox. It is **never** set by an admin.

```sql
CREATE TYPE doc_status AS ENUM (
  'in_transit',    -- Dispatched by sender; sitting in target dept inbox
  'picked_up',     -- A worker has claimed the document from the inbox
  'in_progress',   -- Worker is actively processing
  'forwarded',     -- Forwarded to another department; new transit leg begins
  'completed'      -- Closed by the assigned worker
);

CREATE TABLE documents (
  id                      SERIAL PRIMARY KEY,
  subject                 VARCHAR(500)  NOT NULL,
  body                    TEXT,
  file_path               TEXT,                          -- Uploaded attachment path

  status                  doc_status    NOT NULL DEFAULT 'in_transit',

  -- Parties
  created_by              INT           NOT NULL REFERENCES users(id),
  sender_department_id    INT           NOT NULL REFERENCES departments(id),
  receiver_department_id  INT           NOT NULL REFERENCES departments(id),

  -- Self-assignment: set when a worker picks up the document
  assigned_to             INT           REFERENCES users(id),
  picked_up_at            TIMESTAMPTZ,

  -- Numbering
  outward_number          VARCHAR(100),                  -- Generated on creation
  inward_number           VARCHAR(100),                  -- Generated on pick-up

  created_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
```

### 4.4 Document Number Sequences

```sql
-- One counter row per department per year per direction
CREATE TABLE doc_number_sequences (
  id              SERIAL PRIMARY KEY,
  department_id   INT         NOT NULL REFERENCES departments(id),
  direction       VARCHAR(10) NOT NULL CHECK (direction IN ('inward', 'outward')),
  year            SMALLINT    NOT NULL,
  last_number     INT         NOT NULL DEFAULT 0,
  UNIQUE (department_id, direction, year)
);
```

### 4.5 Document Forwarding History

Each forward leg is recorded here. A forwarded document re-enters the target department's inbox with a new `in_transit` status.

```sql
CREATE TABLE document_forwards (
  id                    SERIAL PRIMARY KEY,
  document_id           INT           NOT NULL REFERENCES documents(id),
  from_user_id          INT           NOT NULL REFERENCES users(id),
  from_department_id    INT           NOT NULL REFERENCES departments(id),
  to_department_id      INT           NOT NULL REFERENCES departments(id),
  note                  TEXT,
  new_outward_number    VARCHAR(100),
  forwarded_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
```

### 4.6 Audit Logs

```sql
CREATE TABLE audit_logs (
  id            SERIAL PRIMARY KEY,
  actor_id      INT          NOT NULL REFERENCES users(id),
  action        VARCHAR(100) NOT NULL,    -- e.g. 'document.created', 'document.picked_up'
  entity_type   VARCHAR(50)  NOT NULL,    -- e.g. 'document', 'user', 'department'
  entity_id     INT,
  metadata      JSONB,                    -- Contextual snapshot (see Section 10)
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_actor   ON audit_logs(actor_id);
CREATE INDEX idx_audit_entity  ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);
```

---

## 5. Backend Architecture

### 5.1 Express App Entry (`server/src/app.js`)

```
- Load env
- Connect to PostgreSQL pool
- Register global middleware: helmet, cors, express.json, morgan
- Mount all routers under /api/v1/
- 404 handler
- Global error handler
```

### 5.2 Authentication Middleware (`middleware/auth.js`)

- Verifies `Authorization: Bearer <token>` header using `jsonwebtoken`.
- Attaches `req.user = { id, role, department_id }` for downstream use.
- Returns `401` if token is missing or invalid.

### 5.3 RBAC Middleware (`middleware/rbac.js`)

```js
// Usage in route files:
router.get('/departments',  auth, rbac('super_admin'), listDepartments);
router.post('/documents',   auth, rbac('worker'),      createDocument);
router.get('/audit',        auth, rbac('super_admin'), getAuditLog);
```

Accepts one or more allowed roles. Returns `403` if `req.user.role` is not in the list.

### 5.4 Numbering Utility (`utils/numbering.js`)

Generates department-wise, year-scoped inward/outward numbers atomically.

**Format:** `{DEPT_CODE}/{DIRECTION}/{YEAR}/{SEQUENCE_PADDED}`
**Example:** `CID/OUT/2025/0042`, `REC/IN/2025/0011`

```
generateNumber(departmentId, direction, pgClient) → string
  1. Get current year.
  2. INSERT ... ON CONFLICT DO UPDATE to upsert the sequence row with SELECT FOR UPDATE.
  3. Increment last_number by 1.
  4. Return formatted string using department code joined from departments table.
  5. Must be called inside the same transaction as the document operation.
```

### 5.5 Audit Logger Utility (`utils/auditLogger.js`)

```js
auditLog({ actorId, action, entityType, entityId, metadata, client })
```

- Always call within the same DB transaction as the primary operation so the log is atomic.
- `client` is a pg transaction client. Required for all document operations.

### 5.6 File Storage Abstraction (`utils/storage.js`)

```js
async function saveFile(fileBuffer, originalName) → { filename, path }
async function getFileUrl(filename) → string
async function deleteFile(filename) → void
```

Phase 1 stores files to local `/uploads`. Phase 2 replaces internals with S3 without changing callers.

---

## 6. API Reference

All routes are prefixed with `/api/v1`. All protected routes require `Authorization: Bearer <token>`.

Roles legend: **SA** = `super_admin`, **W** = `worker`, **All** = `super_admin` or `worker`.

---

### 6.1 Auth

| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/auth/login` | Public | Login with `{ email, password }`. Returns `{ accessToken, user }`. |
| POST | `/auth/logout` | Auth | Clears client-side token (stateless). |
| PATCH | `/auth/change-password` | All | Change own password with `{ currentPassword, newPassword }`. |

**Login request:**
```json
{ "email": "rajesh@edms.local", "password": "Pass@1234" }
```

**Login response:**
```json
{
  "accessToken": "<jwt>",
  "user": {
    "id": 7,
    "name": "Rajesh Kumar",
    "role": "worker",
    "department_id": 3,
    "department_name": "CID"
  }
}
```

---

### 6.2 Departments

All department management is restricted to Super Admin.

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/departments` | SA | List all departments. |
| POST | `/departments` | SA | Create a department. |
| PATCH | `/departments/:id` | SA | Update department name or code. |
| DELETE | `/departments/:id` | SA | Soft-delete (set `is_active = false`). |

---

### 6.3 Users

Super Admin manages all users.

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/users` | SA | List all users. Supports `?department_id=` filter. |
| GET | `/users/:id` | SA | Get a single user's details. |
| POST | `/users` | SA | Create a new worker. Generates secure temporary password. |
| PATCH | `/users/:id` | SA | Update name, department, or active status. |
| PATCH | `/users/:id/reset-password` | SA | Reset a worker's password. |
| DELETE | `/users/:id` | SA | Soft-delete. |

---

### 6.4 Documents

#### Worker — Create & Send

| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/documents` | W | Create and dispatch a document. |

#### Department Inbox — Pick Up

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/documents/inbox` | W | List unclaimed `in_transit` documents for own dept. |
| POST | `/documents/:id/pickup` | W | Worker claims the document. Atomic check. |

#### Worker — Process Documents

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/documents/mine` | W | Documents created by or assigned to worker. |
| GET | `/documents/:id` | SA, W | Full document detail with audit trail. |
| POST | `/documents/:id/start` | W | Mark document `in_progress`. |
| POST | `/documents/:id/forward` | W | Forward to another department. |
| POST | `/documents/:id/complete` | W | Mark document `completed`. |

#### Super Admin — Document Views

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/documents` | SA | List all documents system-wide. Supports various filters. |

---

### 6.5 Audit Logs

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/audit` | SA | System-wide audit log with filters. |

---

### 6.6 Internal Testing Utilities (Development Only)

These endpoints are for internal use and rapid data cleanup during the development and validation phase.

| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/test/cleanup` | Internal | Deletes specific or all users/documents (Internal use only). |

---

## 7. Frontend Architecture

### 7.1 Authentication Flow

1. User submits login form → `POST /api/v1/auth/login`.
2. `accessToken` and `user` object stored in `AuthContext` (memory) and `localStorage`.
3. Axios interceptor attaches `Authorization: Bearer <token>` to every request.
4. On app load, restore session from `localStorage`.

### 7.2 Routing & Protected Routes

`ProtectedRoute` reads `user.role` from `AuthContext`. If the role does not match or the user is unauthenticated, redirect to `/login`.

---

### 7.3 Page Inventory

#### Super Admin (`/admin/`)

- `SystemDashboard`: Stats and activity.
- `Departments`: CRUD with **View Workers** shortcut.
- `UserManagement`: CRUD with department filter and temporary password modal.
- `AllDocuments`: System-wide document view.
- `AuditLog`: Full audit trail viewer.

#### Worker (`/worker/`)

- `WorkerDashboard`: Personal stats.
- `DeptInbox`: Pick up unclaimed documents.
- `CreateDocument`: Dispatch new document.
- `MyDocuments`: Assigned/created document list.
- `DocumentDetail`: Full view with audit timeline and action buttons.

---

### 7.4 Key Shared Components

- **`DocumentCard`** — Compact metadata view.
- **`AuditTimeline`** — Vertical timeline for document history.
- **`StatusBadge`** — Color-coded status indicator.
- **`ProtectedRoute`** — Role-gated layout wrapper.
- **`ChangePasswordModal`** — Self-service password update component accessible from all layouts.

---

## 8. Role-Based Access Control

### Rules Summary

(Refer to section 8 in original for full table)
- **SA:** Manage Departments, Users, View all Documents, View Audit Logs.
- **Worker:** Create Docs, View Inbox, Pick Up Docs, Process/Forward/Complete own docs.

---

## 9. Document Workflow Logic

### 9.1 Lifecycle Flow

1. **Dispatch:** Worker creates doc → `in_transit`.
2. **Pickup:** Target worker claims doc → `picked_up`.
3. **Action:** Worker starts processing → `in_progress`.
4. **Transition:** Worker forwards (resets to `in_transit`) or completes.

### 9.2 Technical Implementation Detail (Challenge & Fix)

**Challenge:** Handling race conditions when multiple workers click "Pick Up" simultaneously for the same document.

**Fix:** Implemented an atomic database `UPDATE` with a `WHERE assigned_to IS NULL` clause. 

```sql
UPDATE documents
SET assigned_to = $workerId, status = 'picked_up', picked_up_at = NOW()
WHERE id = $id AND assigned_to IS NULL AND status = 'in_transit'
RETURNING *;
```

If the affected rows count is 0, the backend returns a `409 Conflict`. The frontend captures this and shows a "Someone else just picked this up" toast notification, then refreshes the inbox.

---

## 10. Audit Logging

Every meaningful system event must write a row to `audit_logs` within the same transaction as the primary operation. Uses `utils/auditLogger.js`.

---

## 11. Environment Configuration

(Refer to section 11 in original for .env samples)

---

## 12. Build & Run Instructions

(Refer to section 12 in original for setup commands)

---

## 13. Phase 2 Hooks

- **Storage:** `utils/storage.js` abstraction ready for S3.
- **Search:** `search_vector` column and GIN index in `documents` table.
- **OCR:** `ocr_queue` table for background processing.
- **Visual API Book:** Planned deliverable `Doc/V1.0/API_BOOK.md` for visual request/response documentation.

---

## 14. Project Governance & Implementation Logs

### Implementation Log (Phase 1 MVP)

| Milestone | Activity | Date | Developer |
|---|---|---|---|
| **0** | Planning & Governance (Specs, Skills, Constitution) | 2026-03-30 | AI Architect |
| **1** | Database Schema & Backend Foundation | 2026-03-30 | Senior AI Engineer |
| **2** | Identity, Admin Modules & Audit Logger | 2026-03-30 | Senior AI Engineer |
| **3** | Core Document Routing (Numbering, Creation, Pickup) | 2026-03-30 | Senior AI Engineer |
| **4** | Document Lifecycle (Forwarding, Processing) | 2026-03-30 | Senior AI Engineer |
| **5** | React Frontend & E2E Validation | 2026-03-30 | Senior AI Engineer |

### Key Technical Decisions

- **PostgreSQL Transactions:** Ensures atomic document state changes and audit logs.
- **Atomic Pickup:** Prevents race conditions and duplicate assignments.
- **Crypto-based Passwords:** Uses Node's `crypto` module for unpredictable temporary credentials.
- **Stateless JWT:** Reduces server overhead while maintaining secure role-based access.

---

*End of Project Documentation — EDMS Phase 1 MVP v1.0*
