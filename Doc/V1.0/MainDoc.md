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
- Super Admin creates departments and workers, then shares login credentials with each worker directly.
- Workers independently pick up documents from their department inbox — no assignment by an admin occurs. The first worker to pick a document becomes its owner.
- Auto-generate department-wise inward/outward document numbers.
- Maintain a full audit log of every document action.

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
    │   │   └── ProtectedRoute.jsx
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

Roles legend: **SA** = `super_admin`, **W** = `worker`

---

### 6.1 Auth

| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/auth/login` | Public | Login with `{ email, password }`. Returns `{ accessToken, user }`. |
| POST | `/auth/logout` | Auth | Clears client-side token (stateless; invalidates on client). |

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

**POST `/departments` body:**
```json
{ "name": "Crime Investigation Department", "code": "CID" }
```

---

### 6.3 Users

Super Admin manages all users. Workers have no access to user management endpoints.

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/users` | SA | List all users system-wide. Supports `?department_id=` filter. |
| GET | `/users/:id` | SA | Get a single user's details. |
| POST | `/users` | SA | Create a new worker. Returns plain-text password for the admin to share. |
| PATCH | `/users/:id` | SA | Update name, department, or active status. |
| PATCH | `/users/:id/reset-password` | SA | Reset a worker's password. Returns new plain-text password. |
| DELETE | `/users/:id` | SA | Soft-delete (set `is_active = false`). |

**POST `/users` body:**
```json
{
  "name": "Priya Sharma",
  "email": "priya@edms.local",
  "role": "worker",
  "department_id": 3
}
```

**POST `/users` response:**

The backend auto-generates a random temporary password, stores its hash, and returns the plain-text version **once**. The Super Admin communicates this to the worker directly (in person or via a secure channel).

```json
{
  "user": {
    "id": 12,
    "name": "Priya Sharma",
    "email": "priya@edms.local",
    "role": "worker",
    "department_id": 3
  },
  "temporaryPassword": "Xk9#mR2pLq"
}
```

> ⚠️ The plain-text password is **never stored** and is returned only in this response. It cannot be retrieved again. A reset generates a new one.

---

### 6.4 Documents

#### Worker — Create & Send

| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/documents` | W | Create and dispatch a document to a target department. |

**POST `/documents` body** (multipart/form-data):
```
subject             string (required)
body                string (optional)
receiver_department_id  integer (required)
file                file attachment (optional)
```

**Response:**
```json
{
  "id": 101,
  "outward_number": "CID/OUT/2025/0042",
  "status": "in_transit"
}
```

---

#### Department Inbox — Pick Up

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/documents/inbox` | W | List all `in_transit` documents for the worker's own department. These are unclaimed and available to pick up. |
| POST | `/documents/:id/pickup` | W | Worker claims the document. Sets `assigned_to`, `picked_up_at`, `inward_number`, and status → `picked_up`. Fails if document is already claimed. |

> **Self-assignment rule:** The first worker to call `POST /documents/:id/pickup` wins. The endpoint uses a database-level check to prevent race conditions:
> ```sql
> UPDATE documents
> SET assigned_to = $workerId, status = 'picked_up', picked_up_at = NOW()
> WHERE id = $id AND assigned_to IS NULL AND status = 'in_transit'
> RETURNING *;
> ```
> If 0 rows are updated, return `409 Conflict` — document already claimed.

---

#### Worker — Process Documents

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/documents/mine` | W | Documents created by or currently assigned to the requesting worker. |
| GET | `/documents/:id` | SA, W | Full document detail including audit trail. Workers can only access documents in their scope. |
| POST | `/documents/:id/start` | W | Mark document `in_progress`. Only the assigned worker may do this. |
| POST | `/documents/:id/forward` | W | Forward to another department. Only the assigned worker may do this. |
| POST | `/documents/:id/complete` | W | Mark document `completed`. Only the assigned worker may do this. |

**POST `/documents/:id/forward` body:**
```json
{
  "to_department_id": 7,
  "note": "Forwarding for senior review."
}
```

**Forward behaviour:**
- Inserts a row into `document_forwards`.
- Generates a new outward number from the forwarding worker's department.
- Resets `assigned_to = NULL`, `status = 'in_transit'` so it appears in the target department's inbox.
- The target department's workers can now pick it up.

---

#### Super Admin — Document Views

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/documents` | SA | List all documents system-wide. Supports filters: `?department_id=`, `?status=`, `?from=`, `?to=`, `?assigned_to=`. |
| GET | `/documents/:id` | SA | Full document detail. |

---

### 6.5 Audit Logs

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/audit` | SA | System-wide audit log. Supports `?entity_id=`, `?actor_id=`, `?action=`, `?from=`, `?to=` filters. |

---

## 7. Frontend Architecture

### 7.1 Authentication Flow

1. User submits login form → `POST /api/v1/auth/login`.
2. `accessToken` and `user` object stored in `AuthContext` (memory) and `localStorage`.
3. Axios interceptor attaches `Authorization: Bearer <token>` to every outgoing request.
4. On app load, restore session from `localStorage`.
5. On `401` response from any request, clear session and redirect to `/login`.

### 7.2 Routing & Protected Routes

```jsx
// App.jsx route structure
<Routes>
  <Route path="/login" element={<LoginPage />} />

  <Route element={<ProtectedRoute allowedRoles={['super_admin']} />}>
    <Route path="/admin/*" element={<SuperAdminLayout />} />
  </Route>

  <Route element={<ProtectedRoute allowedRoles={['worker']} />}>
    <Route path="/worker/*" element={<WorkerLayout />} />
  </Route>

  {/* Catch-all: redirect to role-appropriate dashboard */}
  <Route path="*" element={<RoleRedirect />} />
</Routes>
```

`ProtectedRoute` reads `user.role` from `AuthContext`. If the role does not match or the user is unauthenticated, redirect to `/login`.

`RoleRedirect` sends `super_admin` → `/admin/dashboard` and `worker` → `/worker/dashboard`.

---

### 7.3 Page Inventory

#### Super Admin (`/admin/`)

| Path | Component | Purpose |
|---|---|---|
| `/admin/dashboard` | `SystemDashboard` | System-wide stats: total docs, departments, active workers, recent activity feed. |
| `/admin/departments` | `Departments` | Create, edit, soft-delete departments. |
| `/admin/users` | `UserManagement` | Create workers, view by department, reset passwords, deactivate accounts. Displays generated temporary password in a one-time modal on creation. |
| `/admin/documents` | `AllDocuments` | System-wide document list with status, department, date, and assignee filters. |
| `/admin/audit` | `AuditLog` | Full audit log with filters by action, entity, actor, and date range. |

---

#### Worker (`/worker/`)

| Path | Component | Purpose |
|---|---|---|
| `/worker/dashboard` | `WorkerDashboard` | Personal stats: picked up, in-progress, forwarded, completed. |
| `/worker/inbox` | `DeptInbox` | All unclaimed `in_transit` documents for the worker's department. Each card shows a **Pick Up** button. |
| `/worker/create` | `CreateDocument` | Form to compose and dispatch a new document to a target department. |
| `/worker/my-documents` | `MyDocuments` | All documents currently assigned to or created by this worker. |
| `/worker/document/:id` | `DocumentDetail` | Full document view with subject, body, file attachment, numbering, audit timeline, and context-sensitive action buttons. |

---

### 7.4 DocumentDetail — Action Buttons

Render conditionally based on `document.status` and `document.assigned_to`:

| Document Status | Condition | Button Shown |
|---|---|---|
| `in_transit` | Worker's dept matches `receiver_department_id` | **Pick Up** |
| `picked_up` | `assigned_to === currentUser.id` | **Start Processing** |
| `in_progress` | `assigned_to === currentUser.id` | **Forward**, **Complete** |
| `forwarded` | — | View only (transit leg in progress) |
| `completed` | — | View only |

> If `assigned_to !== currentUser.id`, the worker sees the document in read-only mode (e.g. viewing a colleague's document from the inbox history). No actions are available.

---

### 7.5 DeptInbox — Pick Up Race Condition (UI)

When a worker clicks **Pick Up**, the frontend must handle a `409 Conflict` gracefully:

```
1. Worker clicks Pick Up.
2. POST /documents/:id/pickup
3a. 200 OK  → navigate to /worker/document/:id, show success toast.
3b. 409 Conflict → show toast: "This document was just picked up by a colleague."
                   Refresh the inbox list to remove the document.
```

---

### 7.6 UserManagement — Credential Modal (Super Admin)

When Super Admin creates a new user, the API returns a `temporaryPassword`. Display it immediately in a modal:

```
┌──────────────────────────────────────────┐
│  User Created Successfully               │
│                                          │
│  Name:     Okasha nadeem                 │
│  Email:    okasha@edms.local             │
│  Password: Xk9#mR2pLq                    │
│                                          │
│  ⚠️  Copy this password now.            │
│  It will not be shown again.             │
│                                          │
│  [ Copy Password ]     [ Done ]          │
└──────────────────────────────────────────┘
```

The same modal appears when a password is reset via `PATCH /users/:id/reset-password`.

---

### 7.7 Key Shared Components

- **`DocumentCard`** — Compact card showing subject, status badge, outward/inward number, sender/receiver departments, and assigned worker name (if any).
- **`AuditTimeline`** — Vertical timeline rendering the audit log for a single document, ordered newest-first.
- **`StatusBadge`** — Color-coded pill per status: `in_transit` → blue, `picked_up` → yellow, `in_progress` → orange, `forwarded` → purple, `completed` → green.
- **`ProtectedRoute`** — Role-gated layout wrapper.

---

## 8. Role-Based Access Control

### Rules Summary

| Action | super_admin | worker |
|---|---|---|
| Create department | ✅ | ❌ |
| Edit / deactivate department | ✅ | ❌ |
| Create worker account | ✅ | ❌ |
| Reset worker password | ✅ | ❌ |
| Deactivate worker account | ✅ | ❌ |
| View all documents (system-wide) | ✅ | ❌ |
| View dept inbox | ❌ | ✅ (own dept only) |
| View own documents | ❌ | ✅ |
| Create & dispatch document | ❌ | ✅ |
| Pick up document from inbox | ❌ | ✅ (own dept, unclaimed only) |
| Start / process document | ❌ | ✅ (assigned worker only) |
| Forward document | ❌ | ✅ (assigned worker only) |
| Complete document | ❌ | ✅ (assigned worker only) |
| View audit log | ✅ | ❌ |

### Data Scoping Rules — Enforced Server-Side

These rules must be applied in service/query layers. Never rely on the client to scope data.

**Worker inbox query:** Only return documents where `receiver_department_id = req.user.department_id AND status = 'in_transit' AND assigned_to IS NULL`.

**Worker "my documents" query:** Return documents where `assigned_to = req.user.id OR created_by = req.user.id`.

**Worker document detail:** Reject with `403` if the document does not belong to the worker's scope (not in their department's inbox, not assigned to them, not created by them).

**Super Admin:** No scoping restrictions. Has full read/write access across all departments.

---

## 9. Document Workflow Logic

### Full Lifecycle

```
[Worker A: Create & Dispatch]
        │
        │  outward_number generated for sender_dept
        │  status → 'in_transit'
        │  assigned_to = NULL
        ▼
[Target Department Inbox]
  (visible to all workers in receiver_dept)
        │
        │  [Any Worker in Receiver Dept: Pick Up]
        │  First to call /pickup wins (DB-level atomic check)
        │  inward_number generated for receiver_dept
        │  assigned_to = that worker's id
        │  status → 'picked_up'
        ▼
[Assigned Worker: Start Processing]
        │  status → 'in_progress'
        ▼
[Assigned Worker: Decision]
        │
        ├──── [Forward to Another Dept]
        │         new outward_number generated from current dept
        │         document_forwards row inserted
        │         assigned_to = NULL
        │         status → 'in_transit'
        │         → Document re-enters target dept inbox
        │
        └──── [Complete]
                  status → 'completed'
                  ▼
             [Closed — read only]
```

### Transaction Requirements

All of the following operations **must be wrapped in a single PostgreSQL transaction**:

| Operation | Steps Inside Transaction |
|---|---|
| **Create document** | Insert document row + generate outward number + write audit log. |
| **Pick up document** | Atomic UPDATE with `WHERE assigned_to IS NULL` check + generate inward number + write audit log. |
| **Forward document** | Insert `document_forwards` row + reset document (`assigned_to = NULL`, `status = 'in_transit'`) + generate new outward number + write audit log. |
| **Complete document** | Update status + write audit log. |

---

## 10. Audit Logging

Every meaningful system event must write a row to `audit_logs` within the same transaction as the primary operation.

### Mandatory Logged Actions

| Action Key | Trigger |
|---|---|
| `document.created` | Document created and dispatched by a worker. |
| `document.picked_up` | A worker claims a document from the inbox. |
| `document.started` | Worker marks document in-progress. |
| `document.forwarded` | Document forwarded to another department. |
| `document.completed` | Worker marks document complete. |
| `user.created` | Super Admin creates a new worker account. |
| `user.password_reset` | Super Admin resets a worker's password. |
| `user.deactivated` | Super Admin deactivates a user account. |
| `department.created` | Super Admin creates a new department. |
| `department.updated` | Super Admin edits department name or code. |

### Metadata Convention

Store enough snapshot data to reconstruct the event without joins:

```json
// document.picked_up example
{
  "subject": "Request for Additional Staff — CID Unit",
  "inward_number": "REC/IN/2025/0011",
  "receiver_department": "Records",
  "worker_name": "Priya Sharma"
}

// document.forwarded example
{
  "from_department": "CID",
  "to_department": "Records",
  "note": "Forwarding for archival.",
  "new_outward_number": "CID/OUT/2025/0043"
}

// user.created example
{
  "created_user_name": "Priya Sharma",
  "created_user_email": "priya@edms.local",
  "department": "Records"
}
```

---

## 11. Environment Configuration

### Server (`server/.env`)

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/edms_db

# Auth
JWT_SECRET=replace_with_a_long_random_string_minimum_32_chars
JWT_EXPIRES_IN=8h

# App
PORT=4000
NODE_ENV=development

# File Storage
UPLOAD_DIR=./uploads
MAX_FILE_SIZE_MB=10
```

### Client (`client/.env`)

```env
VITE_API_BASE_URL=http://localhost:4000/api/v1
```

---

## 12. Build & Run Instructions

### Prerequisites

- Node.js >= 18
- PostgreSQL >= 14
- npm >= 9

### Setup

```bash
# 1. Clone the repo
git clone <repo-url>
cd edms

# 2. Install backend dependencies
cd server && npm install

# 3. Install frontend dependencies
cd ../client && npm install

# 4. Create the database
createdb edms_db

# 5. Run schema
psql edms_db -f server/sql/schema.sql

# 6. Seed initial super admin
psql edms_db -f server/sql/seed.sql

# 7. Start backend (development)
cd ../server && npm run dev

# 8. Start frontend (development)
cd ../client && npm run dev
```

### Default Seed Credentials

```
Email:    superadmin@edms.local
Password: Admin@1234
Role:     super_admin
```

> Change this password immediately after first login.

### Seed File Notes (`server/sql/seed.sql`)

The seed must insert one `super_admin` user with a bcrypt-hashed password and `department_id = NULL`. No departments or workers are seeded — the Super Admin creates these through the UI.

---

## 13. Phase 2 Hooks

Build the following stubs now so Phase 2 additions require minimal refactoring.

### 13.1 File Storage Abstraction

Already defined in `utils/storage.js` (see Section 5.6). Phase 2 replaces the local disk implementation with S3/object storage without changing any callers.

### 13.2 Full-Text Search Placeholder

Add a `search_vector` column to `documents` now. Leave it unused in Phase 1. Phase 2 activates search against it.

```sql
ALTER TABLE documents ADD COLUMN search_vector TSVECTOR;
CREATE INDEX idx_documents_search ON documents USING GIN(search_vector);

-- Phase 2 will add a trigger to populate this on INSERT/UPDATE:
-- search_vector = to_tsvector('english', coalesce(subject,'') || ' ' || coalesce(body,''))
```

### 13.3 OCR Queue Table

```sql
CREATE TABLE ocr_queue (
  id            SERIAL PRIMARY KEY,
  document_id   INT NOT NULL REFERENCES documents(id),
  status        VARCHAR(20) NOT NULL DEFAULT 'pending',  -- pending, processing, done, failed
  result_text   TEXT,
  queued_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at  TIMESTAMPTZ
);
```

Phase 2 enqueues a row whenever a document with a file attachment is created. Phase 1 leaves this table empty.

### 13.4 Legacy Import Table

```sql
CREATE TABLE legacy_imports (
  id            SERIAL PRIMARY KEY,
  source        VARCHAR(100),           -- 'paper_register', 'spreadsheet', 'email_archive'
  raw_data      JSONB,
  document_id   INT REFERENCES documents(id),
  imported_by   INT REFERENCES users(id),
  imported_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

Phase 2 migration tooling writes to this table to link imported records back to the documents they produced.

---

*End of Project Documentation — EDMS Phase 1 MVP v2*