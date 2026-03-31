# Electronic Document Management System (EDMS)
## Claude Code Project Documentation — Phase 1.1

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
10. [Compose & Rich Text Editor](#10-compose--rich-text-editor)
11. [Draft Management](#11-draft-management)
12. [Officer & Assistant Workflow](#12-officer--assistant-workflow)
13. [OTP-Based Delegated Sending](#13-otp-based-delegated-sending)
14. [Document Restriction (Access Control)](#14-document-restriction-access-control)
15. [Reference Linking](#15-reference-linking)
16. [Multi-Destination (CC / BCC)](#16-multi-destination-cc--bcc)
17. [Audit Logging](#17-audit-logging)
18. [Environment Configuration](#18-environment-configuration)
19. [Build & Run Instructions](#19-build--run-instructions)
20. [Phase 2 Hooks](#20-phase-2-hooks)
21. [Project Governance & Implementation Logs](#21-project-governance--implementation-logs)

---

## 1. Project Overview

### Purpose

The EDMS replaces a paper-based dak (correspondence) process and informal channels (WhatsApp, email) with a centralized, role-controlled, fully traceable digital workflow for a police department.

### Roles

The system has the following roles:

| Role | Description |
|---|---|
| `super_admin` | Manages the entire system — departments, users, documents, and audit logs. |
| `worker` | Belongs to a department. Creates, picks up, processes, forwards, and completes documents. |
| `officer` | A senior role within a department. Can compose documents, review drafts submitted by assistants, approve or request revisions, and send documents. Has a personal draft inbox. |
| `assistant` | Works under an Officer. Can compose and draft documents, and may send documents on behalf of an assigned Officer subject to approval or OTP verification. |

> **There is no Department Admin role.** All administrative responsibilities previously associated with a department admin are handled entirely by the Super Admin.
>
> **Assistants are always linked to a specific Officer.** The `officer_id` foreign key on the `users` table enforces this relationship.

### Goals for Phase 1.1

All goals from Phase 1 MVP are retained. The following are added:

- **Rich Text Compose:** Replace the plain description field with a full MS-Word-style rich text editor (bold, italic, font size, bullets, etc.) on a dedicated Compose page.
- **Draft Management:** A dedicated Drafts page where users can save, review, and finalize documents before sending.
- **Officer / Assistant Workflow:** Assistants can draft documents on behalf of Officers. Officers review, approve, request revisions, or reject drafts before dispatch.
- **OTP-Delegated Sending:** If an Officer grants an Assistant send-authority, the Assistant can trigger an OTP to the Officer's registered email and send on the Officer's behalf after OTP verification.
- **Document Restriction:** Senders may restrict a document so that only a specified recipient (by name/role) can open its contents, even though the document is visible in the department for record-keeping.
- **Reference Linking:** A document may carry a reference to one or more previous documents, searchable by subject or document number inside the Compose/Draft interface.
- **Multi-Destination (CC / BCC):** A document can be dispatched to a primary receiver department plus one or more CC and BCC departments simultaneously.

### Success Criteria

All Phase 1 success criteria are retained. The following are added:

1. A Worker/Officer/Assistant can compose a rich-text document and save it as a draft.
2. An Assistant can submit a draft on behalf of an Officer; the Officer sees it in their draft inbox.
3. An Officer can approve a draft (dispatching it) or send it back for revision.
4. An Assistant with OTP authority can request an OTP, enter it, and send the document on the Officer's behalf.
5. A restricted document is visible in the inbox list but cannot be opened by unauthorized users.
6. A composed document can reference one or more prior documents, and the reference chain is visible on the document detail page.
7. A document can be dispatched simultaneously to a primary department plus multiple CC/BCC departments.

### Out of Scope (Phase 1.1)

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
| Rich Text Editor | **Tiptap** (headless ProseMirror wrapper) — renders to/from HTML |
| OTP Generation | Node.js `crypto.randomInt` — 6-digit numeric OTP, TTL 10 minutes |

---

## 3. Repository Structure

```
edms/
├── server/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   └── rbac.js
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
│   │   │   ├── drafts/
│   │   │   │   ├── drafts.routes.js          # NEW — Draft CRUD & submission
│   │   │   │   ├── drafts.controller.js
│   │   │   │   └── drafts.service.js
│   │   │   ├── otp/
│   │   │   │   ├── otp.routes.js             # NEW — OTP request & verify
│   │   │   │   ├── otp.controller.js
│   │   │   │   └── otp.service.js
│   │   │   └── audit/
│   │   │       ├── audit.routes.js
│   │   │       ├── audit.controller.js
│   │   │       └── audit.service.js
│   │   ├── utils/
│   │   │   ├── numbering.js
│   │   │   ├── auditLogger.js
│   │   │   ├── storage.js
│   │   │   └── mailer.js                     # Node Mailer wrapper (existing, extended)
│   │   └── app.js
│   ├── uploads/
│   ├── sql/
│   │   ├── schema.sql
│   │   └── seed.sql
│   ├── .env
│   └── package.json
│
└── client/
    ├── src/
    │   ├── api/
    │   │   └── axios.js
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   ├── layouts/
    │   │   ├── SuperAdminLayout.jsx
    │   │   ├── WorkerLayout.jsx
    │   │   ├── OfficerLayout.jsx             # NEW
    │   │   └── AssistantLayout.jsx           # NEW
    │   ├── pages/
    │   │   ├── super-admin/
    │   │   │   ├── SystemDashboard.jsx
    │   │   │   ├── Departments.jsx
    │   │   │   ├── UserManagement.jsx
    │   │   │   ├── AllDocuments.jsx
    │   │   │   └── AuditLog.jsx
    │   │   ├── worker/
    │   │   │   ├── WorkerDashboard.jsx
    │   │   │   ├── Compose.jsx               # NEW — replaces CreateDocument
    │   │   │   ├── Drafts.jsx                # NEW
    │   │   │   ├── DeptInbox.jsx
    │   │   │   ├── MyDocuments.jsx
    │   │   │   └── DocumentDetail.jsx
    │   │   ├── officer/
    │   │   │   ├── OfficerDashboard.jsx      # NEW
    │   │   │   ├── Compose.jsx               # NEW
    │   │   │   ├── Drafts.jsx                # NEW — includes assistant-submitted drafts
    │   │   │   ├── DeptInbox.jsx
    │   │   │   ├── MyDocuments.jsx
    │   │   │   └── DocumentDetail.jsx
    │   │   └── assistant/
    │   │       ├── AssistantDashboard.jsx    # NEW
    │   │       ├── Compose.jsx               # NEW — includes "on behalf of" selector
    │   │       ├── Drafts.jsx                # NEW
    │   │       ├── DeptInbox.jsx
    │   │       └── DocumentDetail.jsx
    │   ├── components/
    │   │   ├── DocumentCard.jsx
    │   │   ├── AuditTimeline.jsx
    │   │   ├── StatusBadge.jsx
    │   │   ├── ProtectedRoute.jsx
    │   │   ├── ChangePasswordModal.jsx
    │   │   ├── RichTextEditor.jsx            # NEW — Tiptap-based editor
    │   │   ├── DraftReviewPanel.jsx          # NEW — Officer review/revision UI
    │   │   ├── OtpModal.jsx                  # NEW — OTP entry modal for assistant
    │   │   ├── RestrictionSelector.jsx       # NEW — Restrict access to specific user
    │   │   ├── ReferenceSearch.jsx           # NEW — Search & attach reference docs
    │   │   └── CcBccSelector.jsx             # NEW — Multi-destination selector
    │   └── App.jsx
    ├── .env
    └── package.json
```

---

## 4. Database Schema

Run SQL statements in the order listed. Statements from Phase 1 are preserved; new additions are marked **`-- NEW`**.

### 4.1 Departments

```sql
CREATE TABLE departments (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(255) NOT NULL UNIQUE,
  code        VARCHAR(50)  NOT NULL UNIQUE,
  is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
```

### 4.2 Users

```sql
CREATE TYPE user_role AS ENUM ('super_admin', 'worker', 'officer', 'assistant'); -- NEW: officer, assistant

CREATE TABLE users (
  id              SERIAL PRIMARY KEY,
  name            VARCHAR(255)  NOT NULL,
  email           VARCHAR(255)  NOT NULL UNIQUE,
  password_hash   TEXT          NOT NULL,
  role            user_role     NOT NULL,
  department_id   INT           REFERENCES departments(id) ON DELETE SET NULL,
  officer_id      INT           REFERENCES users(id) ON DELETE SET NULL, -- NEW: assistant → officer link
  can_send_on_behalf BOOLEAN    NOT NULL DEFAULT FALSE,                  -- NEW: OTP-delegated send authority
  is_active       BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT worker_must_have_department
    CHECK (role = 'super_admin' OR department_id IS NOT NULL),
  CONSTRAINT assistant_must_have_officer
    CHECK (role != 'assistant' OR officer_id IS NOT NULL)
);
```

### 4.3 Documents

```sql
CREATE TYPE doc_status AS ENUM (
  'draft',         -- NEW: Saved but not yet dispatched
  'in_transit',
  'picked_up',
  'in_progress',
  'forwarded',
  'completed'
);

CREATE TABLE documents (
  id                      SERIAL PRIMARY KEY,
  subject                 VARCHAR(500)  NOT NULL,
  body_html               TEXT,                          -- NEW: Rich text HTML from Tiptap editor
  body                    TEXT,                          -- Legacy plain text (kept for backward compat)
  file_path               TEXT,

  status                  doc_status    NOT NULL DEFAULT 'draft',

  -- Parties
  created_by              INT           NOT NULL REFERENCES users(id),
  sender_department_id    INT           NOT NULL REFERENCES departments(id),
  receiver_department_id  INT           NOT NULL REFERENCES departments(id),
  assigned_to             INT           REFERENCES users(id),
  picked_up_at            TIMESTAMPTZ,

  -- On-behalf-of (NEW)
  behalf_of_officer_id    INT           REFERENCES users(id),           -- Officer on whose behalf doc is sent
  behalf_approved         BOOLEAN       NOT NULL DEFAULT FALSE,         -- Officer approved the draft
  behalf_otp_used         BOOLEAN       NOT NULL DEFAULT FALSE,         -- OTP path was used for dispatch

  -- Draft review (NEW)
  draft_revision_note     TEXT,                                         -- Officer's revision instruction to assistant
  draft_submitted_by      INT           REFERENCES users(id),           -- Who submitted to officer
  draft_submitted_at      TIMESTAMPTZ,

  -- Access restriction (NEW)
  is_restricted           BOOLEAN       NOT NULL DEFAULT FALSE,
  restricted_to_user_id   INT           REFERENCES users(id),           -- Only this user can open the body

  -- Numbering
  outward_number          VARCHAR(100),
  inward_number           VARCHAR(100),

  created_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
```

### 4.4 Document Number Sequences

*(Unchanged from Phase 1)*

```sql
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

*(Unchanged from Phase 1)*

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

### 4.6 Document Recipients — CC / BCC (NEW)

Each row represents one additional destination department for a document.

```sql
CREATE TYPE recipient_type AS ENUM ('cc', 'bcc');  -- NEW

CREATE TABLE document_recipients (                  -- NEW
  id                    SERIAL PRIMARY KEY,
  document_id           INT             NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  department_id         INT             NOT NULL REFERENCES departments(id),
  recipient_type        recipient_type  NOT NULL,   -- 'cc' or 'bcc'
  inward_number         VARCHAR(100),               -- Generated on pickup by that dept
  created_at            TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  UNIQUE (document_id, department_id, recipient_type)
);
```

### 4.7 Document References (NEW)

Links a document to one or more prior documents as references.

```sql
CREATE TABLE document_references (  -- NEW
  id              SERIAL PRIMARY KEY,
  document_id     INT  NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  reference_id    INT  NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (document_id, reference_id),
  CHECK (document_id != reference_id)
);
```

### 4.8 OTP Store (NEW)

Short-lived OTPs for OTP-delegated sending. Cleaned up after use or expiry.

```sql
CREATE TABLE document_otps (   -- NEW
  id              SERIAL PRIMARY KEY,
  document_id     INT          NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  officer_id      INT          NOT NULL REFERENCES users(id),
  assistant_id    INT          NOT NULL REFERENCES users(id),
  otp_hash        TEXT         NOT NULL,   -- bcrypt hash of the 6-digit OTP
  expires_at      TIMESTAMPTZ  NOT NULL,   -- NOW() + 10 minutes
  used            BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
```

### 4.9 Audit Logs

*(Unchanged from Phase 1; new action strings listed in Section 17)*

```sql
CREATE TABLE audit_logs (
  id            SERIAL PRIMARY KEY,
  actor_id      INT          NOT NULL REFERENCES users(id),
  action        VARCHAR(100) NOT NULL,
  entity_type   VARCHAR(50)  NOT NULL,
  entity_id     INT,
  metadata      JSONB,
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
- Attaches `req.user = { id, role, department_id, officer_id, can_send_on_behalf }` for downstream use.
- Returns `401` if token is missing or invalid.

### 5.3 RBAC Middleware (`middleware/rbac.js`)

```js
router.get('/departments',    auth, rbac('super_admin'),              listDepartments);
router.post('/documents',     auth, rbac('worker','officer'),         createDocument);
router.post('/drafts',        auth, rbac('worker','officer','assistant'), saveDraft);
router.get('/audit',          auth, rbac('super_admin'),              getAuditLog);
```

Accepts one or more allowed roles. Returns `403` if `req.user.role` is not in the list.

### 5.4 Numbering Utility (`utils/numbering.js`)

*(Unchanged from Phase 1)*

**Format:** `{DEPT_CODE}/{DIRECTION}/{YEAR}/{SEQUENCE_PADDED}`
**Example:** `CID/OUT/2025/0042`, `REC/IN/2025/0011`

### 5.5 Audit Logger Utility (`utils/auditLogger.js`)

*(Unchanged from Phase 1)*

```js
auditLog({ actorId, action, entityType, entityId, metadata, client })
```

### 5.6 File Storage Abstraction (`utils/storage.js`)

*(Unchanged from Phase 1)*

```js
async function saveFile(fileBuffer, originalName) → { filename, path }
async function getFileUrl(filename) → string
async function deleteFile(filename) → void
```

### 5.7 Mailer Utility (`utils/mailer.js`) — Extended

The existing Node Mailer wrapper is extended with two new functions:

```js
// Existing
async function sendCredentials(email, name, tempPassword) → void
async function sendPasswordReset(email, name, newPassword) → void

// New in Phase 1.1
async function sendOtp(officerEmail, officerName, otpCode, documentSubject) → void
// Sends a 6-digit OTP to the officer with document subject context and 10-minute TTL notice.
```

### 5.8 OTP Service (`modules/otp/otp.service.js`) — NEW

```
requestOtp(documentId, assistantId)
  1. Verify document exists, is a draft, and behalf_of_officer_id is set.
  2. Verify assistantId matches draft_submitted_by or created_by.
  3. Verify officer has can_send_on_behalf = TRUE.
  4. Generate 6-digit crypto.randomInt OTP.
  5. Hash OTP with bcrypt.
  6. INSERT INTO document_otps (expires_at = NOW() + '10 minutes').
  7. Call mailer.sendOtp() to email the officer.
  8. Audit log: 'otp.requested'.

verifyOtp(documentId, assistantId, otpCode)
  1. Fetch latest unused, unexpired OTP row for documentId + officerFromDocument.
  2. bcrypt.compare(otpCode, otp_hash).
  3. If valid: mark used = TRUE, set behalf_otp_used = TRUE on document.
  4. Return verified = true.
  5. Audit log: 'otp.verified'.
```

---

## 6. API Reference

All routes are prefixed with `/api/v1`. All protected routes require `Authorization: Bearer <token>`.

Roles legend: **SA** = `super_admin`, **W** = `worker`, **O** = `officer`, **A** = `assistant`, **All** = any authenticated role.

---

### 6.1 Auth

*(Unchanged from Phase 1)*

| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/auth/login` | Public | Login. Returns `{ accessToken, user }`. |
| POST | `/auth/logout` | Auth | Stateless logout. |
| PATCH | `/auth/change-password` | All | Change own password. |

---

### 6.2 Departments

*(Unchanged from Phase 1)*

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/departments` | SA | List all departments. |
| POST | `/departments` | SA | Create a department. |
| PATCH | `/departments/:id` | SA | Update department. |
| DELETE | `/departments/:id` | SA | Soft-delete. |

---

### 6.3 Users

*(Phase 1 endpoints retained; new fields exposed)*

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/users` | SA | List all users. Supports `?role=`, `?department_id=` filters. |
| GET | `/users/:id` | SA | Get user details. |
| POST | `/users` | SA | Create user. For `assistant` role, `officer_id` is required. |
| PATCH | `/users/:id` | SA | Update name, department, role, `officer_id`, `can_send_on_behalf`, active status. |
| PATCH | `/users/:id/reset-password` | SA | Reset worker/officer/assistant password. |
| DELETE | `/users/:id` | SA | Soft-delete. |

**Create user request (assistant example):**
```json
{
  "name": "Ravi Sharma",
  "email": "ravi@edms.local",
  "role": "assistant",
  "department_id": 3,
  "officer_id": 12,
  "can_send_on_behalf": false
}
```

---

### 6.4 Documents

#### Worker / Officer — Create & Dispatch

| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/documents` | W, O | Directly create and dispatch a document (skips draft). Body includes `body_html`, `receiver_department_id`, optional `cc`, `bcc`, `references`, `is_restricted`, `restricted_to_user_id`. |

**Create document request body:**
```json
{
  "subject": "Request for IT Equipment",
  "body_html": "<p><strong>Dear Sir,</strong></p><ul><li>10 laptops</li></ul>",
  "receiver_department_id": 5,
  "cc": [2, 7],
  "bcc": [4],
  "references": [42, 58],
  "is_restricted": false,
  "restricted_to_user_id": null,
  "file": "<multipart upload>"
}
```

#### Department Inbox — Pick Up

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/documents/inbox` | W, O, A | List unclaimed `in_transit` documents for own dept. Restricted docs show metadata only — body is omitted unless `req.user.id === restricted_to_user_id`. |
| POST | `/documents/:id/pickup` | W, O, A | Atomic self-assignment. Returns `409` on race condition. |

#### Worker / Officer — Process Documents

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/documents/mine` | W, O, A | Documents created by or assigned to the requesting user. |
| GET | `/documents/:id` | SA, W, O, A | Full document detail. Body is redacted for restricted docs if user is not the allowed opener. References and CC/BCC details included. |
| POST | `/documents/:id/start` | W, O | Mark `in_progress`. |
| POST | `/documents/:id/forward` | W, O | Forward to another department. |
| POST | `/documents/:id/complete` | W, O | Mark `completed`. |

#### Super Admin — Document Views

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/documents` | SA | System-wide document list with filters. |

---

### 6.5 Drafts (NEW)

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/drafts` | W, O, A | List own drafts. Officers also see assistant-submitted drafts awaiting their review. |
| POST | `/drafts` | W, O, A | Save a new draft. Body same as `POST /documents` plus optional `behalf_of_officer_id`. |
| PATCH | `/drafts/:id` | W, O, A | Update draft content. Only the creator (or the officer for revision notes) may edit. |
| DELETE | `/drafts/:id` | W, O, A | Delete a draft. Only the creator may delete. |
| POST | `/drafts/:id/submit` | A | Assistant submits a draft to the assigned officer for review. Sets `draft_submitted_by` and `draft_submitted_at`. |
| POST | `/drafts/:id/approve` | O | Officer approves draft and dispatches it. Generates outward number and sets status to `in_transit`. |
| POST | `/drafts/:id/revise` | O | Officer sends draft back to assistant with `draft_revision_note`. |
| POST | `/drafts/:id/send` | W, O | Directly send an own draft (no officer approval required for own drafts). |

**Save draft request body:**
```json
{
  "subject": "Budget Proposal FY26",
  "body_html": "<p>Please find the proposal...</p>",
  "receiver_department_id": 3,
  "cc": [5],
  "bcc": [],
  "references": [33],
  "is_restricted": true,
  "restricted_to_user_id": 9,
  "behalf_of_officer_id": 12
}
```

**Approve response:**
```json
{
  "message": "Draft approved and dispatched.",
  "outward_number": "CID/OUT/2026/0017",
  "document_id": 201
}
```

**Revise response:**
```json
{
  "message": "Draft returned for revision.",
  "draft_revision_note": "Please update the budget figures in section 2."
}
```

---

### 6.6 OTP — Delegated Send (NEW)

| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/otp/request` | A | Assistant requests an OTP for a specific draft. OTP is emailed to the officer. |
| POST | `/otp/verify` | A | Assistant submits OTP. On success, document is dispatched on behalf of the officer. |

**OTP request body:**
```json
{ "document_id": 201 }
```

**OTP verify body:**
```json
{ "document_id": 201, "otp": "847291" }
```

**OTP verify success response:**
```json
{
  "message": "OTP verified. Document dispatched on behalf of Officer.",
  "outward_number": "DIG/OUT/2026/0004",
  "document_id": 201
}
```

---

### 6.7 Audit Logs

*(Unchanged from Phase 1)*

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/audit` | SA | System-wide audit log with filters. |

---

### 6.8 Internal Testing Utilities (Development Only)

| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/test/cleanup` | Internal | Deletes specific or all users/documents. Internal use only. |

---

## 7. Frontend Architecture

### 7.1 Authentication Flow

*(Unchanged from Phase 1)*

1. User submits login form → `POST /api/v1/auth/login`.
2. `accessToken` and `user` object stored in `AuthContext` (memory) and `localStorage`.
3. Axios interceptor attaches `Authorization: Bearer <token>` to every request.
4. On app load, restore session from `localStorage`.

### 7.2 Routing & Protected Routes

`ProtectedRoute` reads `user.role` from `AuthContext`. Roles `officer` and `assistant` are now valid. If the role does not match or the user is unauthenticated, redirect to `/login`.

---

### 7.3 Page Inventory

#### Super Admin (`/admin/`)

- `SystemDashboard` — Stats and activity.
- `Departments` — CRUD with View Workers shortcut.
- `UserManagement` — CRUD with department filter, role filter, and `officer_id` assignment for assistants.
- `AllDocuments` — System-wide document view.
- `AuditLog` — Full audit trail viewer.

#### Worker (`/worker/`)

- `WorkerDashboard` — Personal stats.
- `Compose` — **NEW.** Rich text compose page with CC/BCC selector, reference search, and restriction toggle.
- `Drafts` — **NEW.** List and manage own drafts.
- `DeptInbox` — Pick up unclaimed documents.
- `MyDocuments` — Assigned/created document list.
- `DocumentDetail` — Full view with audit timeline, action buttons, reference chain, and CC/BCC recipients.

#### Officer (`/officer/`)

- `OfficerDashboard` — **NEW.** Personal stats plus pending draft review count.
- `Compose` — **NEW.** Rich text compose page. Identical to Worker Compose.
- `Drafts` — **NEW.** Own drafts plus assistant-submitted drafts pending review. Includes `DraftReviewPanel` for approve/revise actions.
- `DeptInbox` — Pick up unclaimed documents.
- `MyDocuments` — Documents created by or assigned to officer.
- `DocumentDetail` — Full view.

#### Assistant (`/assistant/`)

- `AssistantDashboard` — **NEW.** Personal stats plus drafts awaiting officer action.
- `Compose` — **NEW.** Rich text compose page with an additional **"Send on behalf of"** dropdown pre-populated with the assigned Officer. Includes the OTP send flow when `can_send_on_behalf` is `true`.
- `Drafts` — **NEW.** Own drafts plus their status (pending officer review / revision required / approved).
- `DeptInbox` — Pick up unclaimed documents.
- `DocumentDetail` — Full view.

---

### 7.4 Key Shared Components

- **`DocumentCard`** — Compact metadata view. Shows a lock icon for restricted documents.
- **`AuditTimeline`** — Vertical timeline for document history.
- **`StatusBadge`** — Color-coded status indicator. Includes `draft` and `revision_required` states.
- **`ProtectedRoute`** — Role-gated layout wrapper.
- **`ChangePasswordModal`** — Self-service password update.
- **`RichTextEditor`** — **NEW.** Tiptap-based editor with toolbar: Bold, Italic, Underline, Font Size selector, Bullet List, Ordered List, Paragraph alignment. Outputs and accepts HTML. Renders as a full-width canvas styled to resemble an MS Word page.
- **`DraftReviewPanel`** — **NEW.** Shown to Officers on the Drafts page. Displays draft body (read-only), an Approve button, a Revise button with a revision note text area, and the original submission timestamp and author.
- **`OtpModal`** — **NEW.** Shown to Assistants when `can_send_on_behalf` is `true`. Contains a "Send OTP to Officer" button, a countdown timer (10 minutes), an OTP input field, and a "Confirm & Send" button.
- **`RestrictionSelector`** — **NEW.** Toggle switch to mark a document as restricted. When toggled on, a searchable user dropdown appears to select the permitted opener.
- **`ReferenceSearch`** — **NEW.** Search bar that queries `/documents` by subject or document number. Returns a selectable list; selected items appear as removable chips below the composer.
- **`CcBccSelector`** — **NEW.** Multi-select department picker with two tabs (CC / BCC). Selected departments shown as chips.

---

## 8. Role-Based Access Control

### Rules Summary

| Action | SA | Worker | Officer | Assistant |
|---|---|---|---|---|
| Manage Departments | ✅ | ❌ | ❌ | ❌ |
| Manage Users | ✅ | ❌ | ❌ | ❌ |
| View All Documents | ✅ | ❌ | ❌ | ❌ |
| View Audit Logs | ✅ | ❌ | ❌ | ❌ |
| Compose & Dispatch | ❌ | ✅ | ✅ | ❌ (draft only) |
| Save Draft | ❌ | ✅ | ✅ | ✅ |
| Submit Draft to Officer | ❌ | ❌ | ❌ | ✅ |
| Approve / Revise Draft | ❌ | ❌ | ✅ | ❌ |
| OTP-delegated Send | ❌ | ❌ | ❌ | ✅ (if authorised) |
| View Dept Inbox | ❌ | ✅ | ✅ | ✅ |
| Pick Up Document | ❌ | ✅ | ✅ | ✅ |
| Process / Forward / Complete | ❌ | ✅ | ✅ | ❌ |
| Open Restricted Document | ❌ | Only if `restricted_to_user_id` matches | Same | Same |
| Add CC / BCC | ❌ | ✅ | ✅ | ✅ (in draft) |
| Add Reference | ❌ | ✅ | ✅ | ✅ (in draft) |
| Change Own Password | ✅ | ✅ | ✅ | ✅ |

---

## 9. Document Workflow Logic

### 9.1 Standard Lifecycle Flow

1. **Compose / Draft:** Any authorised user opens the Compose page, writes rich text content, selects receiver, CC, BCC, references, and optional restrictions. They may save as a draft or dispatch directly.
2. **Dispatch:** Document is created with status `in_transit`. Outward number is generated for the sender's department.
3. **Pickup:** Target worker/officer/assistant claims the document → `picked_up`. Inward number is generated. CC recipients also receive the document in their inbox simultaneously.
4. **Process → Forward or Complete:** `in_progress` → `forwarded` (resets to `in_transit`) or `completed`.

### 9.2 Assistant → Officer Draft Flow

1. Assistant opens Compose, selects **"On behalf of: [Officer Name]"** from the dropdown.
2. Saves as draft (status `draft`, `behalf_of_officer_id` set).
3. Assistant clicks **Submit to Officer** → `draft_submitted_by` and `draft_submitted_at` set. Officer receives an in-app notification.
4. Officer opens Drafts page and sees the submitted draft in `DraftReviewPanel`.
5. **If Officer approves:** `behalf_approved = TRUE`, document dispatched, status becomes `in_transit`.
6. **If Officer requests revision:** `draft_revision_note` is saved; draft status remains `draft`. Assistant receives the revision note and can edit and resubmit.
7. The cycle repeats until the Officer approves.

### 9.3 OTP-Delegated Send Flow

This path is only available when the Officer has `can_send_on_behalf = TRUE` and the assistant has a draft ready to send.

1. Assistant finalises the draft but instead of submitting for approval, clicks **"Send on Behalf"**.
2. `OtpModal` opens. Assistant clicks **"Send OTP to Officer"**.
3. Backend calls `otp.service.requestOtp()`: generates a 6-digit OTP, hashes it, stores in `document_otps`, and emails the OTP to the Officer via Node Mailer.
4. Officer receives the email, reads the OTP, and shares it with the assistant verbally or physically.
5. Assistant enters the OTP in `OtpModal` and clicks **"Confirm & Send"**.
6. Backend calls `otp.service.verifyOtp()`: validates hash and TTL, marks OTP used, sets `behalf_otp_used = TRUE`, and dispatches the document.
7. Audit log records both `otp.requested` and `otp.verified` events with document and actor metadata.

### 9.4 Atomic Pickup (Race Condition Handling)

*(Unchanged from Phase 1)*

```sql
UPDATE documents
SET assigned_to = $workerId, status = 'picked_up', picked_up_at = NOW()
WHERE id = $id AND assigned_to IS NULL AND status = 'in_transit'
RETURNING *;
```

If affected rows = 0, backend returns `409 Conflict`. Frontend shows a "Someone else just picked this up" toast and refreshes the inbox.

---

## 10. Compose & Rich Text Editor

### 10.1 Overview

The Compose page replaces the old `CreateDocument` page for all roles that can dispatch documents. It provides a full-page writing experience styled to resemble an MS Word canvas.

### 10.2 Rich Text Editor — Tiptap

The editor is implemented using **Tiptap** (a headless ProseMirror wrapper for React).

**Toolbar features:**

| Control | Tiptap Extension |
|---|---|
| Bold | `Bold` |
| Italic | `Italic` |
| Underline | `Underline` |
| Font Size | `TextStyle` + custom `FontSize` mark |
| Bullet List | `BulletList` + `ListItem` |
| Ordered List | `OrderedList` + `ListItem` |
| Align Left / Center / Right | `TextAlign` |
| Undo / Redo | Built-in History |

**Input / Output format:** HTML string stored in `body_html` column. On load, `editor.commands.setContent(body_html)` is called.

**Canvas styling:** The editor container is styled as a white A4-proportioned card with a subtle shadow, centred on a grey background, giving the appearance of a word processing canvas inside the browser.

### 10.3 Compose Page Layout

The Compose page is divided into two sections:

**Left panel — Metadata:**
- Subject field
- Receiver Department selector (primary)
- CC Department multi-select (`CcBccSelector` — CC tab)
- BCC Department multi-select (`CcBccSelector` — BCC tab)
- Reference Documents search (`ReferenceSearch`)
- Access Restriction toggle (`RestrictionSelector`)
- File attachment upload (optional)
- On Behalf Of selector (Assistant only — pre-filled with linked Officer)
- Action buttons: **Save as Draft** | **Send** (or **Submit to Officer** for assistant)

**Right panel — Rich Text Canvas:**
- Tiptap toolbar
- Full-width editor canvas

### 10.4 Drafts Page

The Drafts page lists all `draft`-status documents belonging to the user. For Officers, an additional **"Pending Review"** tab shows assistant-submitted drafts.

Each draft card shows subject, receiver department, last updated time, and status chip (`Draft`, `Submitted`, `Revision Required`, `Approved`).

Clicking a draft opens the Compose page in edit mode. The editor is read-only for Officers viewing an assistant's submitted draft unless they are adding a revision note.

---

## 11. Draft Management

### 11.1 Draft States

| State | Meaning |
|---|---|
| `draft` | Saved locally; not submitted or sent. |
| `submitted` | Assistant has submitted to officer (UI label only; DB status remains `draft`; tracked via `draft_submitted_at`). |
| `revision_required` | Officer has sent back with a note (UI label only; tracked via `draft_revision_note`). |
| `approved` | Officer has approved; document transitions to `in_transit`. |

> All states above except `approved` keep the document status as `draft` in the database. `approved` triggers the dispatch flow and sets status to `in_transit`.

### 11.2 Auto-Save

The Compose page auto-saves the draft every 30 seconds via a `PATCH /drafts/:id` call if a draft ID exists, or a `POST /drafts` call for a new draft. A subtle "Saved" indicator is shown in the toolbar.

---

## 12. Officer & Assistant Workflow

### 12.1 Officer Capabilities

- Full access to Compose and Drafts pages.
- Personal draft inbox showing own drafts and assistant-submitted drafts.
- Can approve a draft (dispatching it) or send it back with a revision note.
- Can grant or revoke `can_send_on_behalf` to their assigned assistant (via Super Admin in Phase 1.1; self-service in Phase 2).
- Receives OTP via email when assistant requests delegated send.

### 12.2 Assistant Capabilities

- Access to Compose page with **"On behalf of"** selector pre-filled with the linked Officer.
- Can save, edit, and delete own drafts.
- Can submit a draft to the linked Officer for approval.
- Can view revision notes left by the Officer and resubmit after edits.
- If `can_send_on_behalf = TRUE`: can trigger the OTP flow to send on behalf of the Officer without requiring Officer to log in and approve.

### 12.3 Notification Triggers

| Event | Notified Party | Method |
|---|---|---|
| Assistant submits draft | Officer | In-app badge on Drafts page |
| Officer sends back for revision | Assistant | In-app badge on Drafts page |
| OTP requested | Officer | Email via Node Mailer |
| Draft approved and dispatched | Assistant | In-app notification |

---

## 13. OTP-Based Delegated Sending

### 13.1 Purpose

When an Officer grants send authority to their assistant (`can_send_on_behalf = TRUE`), the assistant may dispatch documents on the Officer's behalf without the Officer needing to log in and click Approve. Instead, a one-time password is emailed to the Officer, who shares it with the assistant to authorise each individual dispatch.

### 13.2 Security Properties

- OTP is a cryptographically random 6-digit integer generated via `crypto.randomInt(100000, 999999)`.
- OTP is hashed with bcrypt before storage; the plaintext is never persisted.
- OTP expires after **10 minutes** (`expires_at` column).
- Each OTP is single-use (`used = TRUE` after verification).
- The OTP is tied to a specific `document_id` and `officer_id`; it cannot be reused for a different document.
- A maximum of one active OTP per `(document_id, officer_id)` pair is enforced at the application layer (prior unexpired OTPs are invalidated on a new request).
- All OTP events are written to `audit_logs`.

### 13.3 Email Template

The OTP email sent to the Officer includes:

- Document subject and outward number draft.
- Assistant's name.
- The 6-digit OTP in a prominent block.
- Expiry time (10 minutes from request).
- A note that the OTP should not be shared with anyone other than the requesting assistant.

---

## 14. Document Restriction (Access Control)

### 14.1 Purpose

A sender may mark a document as restricted so that only a designated person can open and read its contents. The document is still visible in the department inbox and document lists for record-keeping purposes, but the body, attachments, and full detail are hidden from all other users.

### 14.2 Behaviour

| Context | Restricted? | Allowed opener | Result |
|---|---|---|---|
| Inbox list | Yes | Anyone | Document card shows subject, sender, date, and a **🔒 Restricted** badge. Body and attachment are not exposed. |
| Document detail | Yes | Non-matching user | Body rendered as `[This document is restricted. You are not authorised to view its contents.]`. Attachment download link is hidden. |
| Document detail | Yes | `restricted_to_user_id` match | Full body and attachment visible. |
| Document detail | Yes | `super_admin` | Full body visible (admin override for governance). |
| Inbox list / detail | No | Anyone | Normal behaviour. |

### 14.3 Backend Enforcement

On `GET /documents/:id`, the service layer checks:

```js
if (document.is_restricted) {
  const canView =
    req.user.role === 'super_admin' ||
    req.user.id === document.restricted_to_user_id;
  if (!canView) {
    document.body_html = null;
    document.file_path = null;
  }
}
```

The restriction is enforced server-side; the frontend never receives the body for unauthorised requests.

---

## 15. Reference Linking

### 15.1 Purpose

A user composing a document may attach references to one or more previously sent or received documents. This creates a visible reference chain on the document detail page, useful for correspondence threads.

### 15.2 Compose Flow

1. In the Compose / Draft page, the user types into the `ReferenceSearch` component (searches by subject or document number).
2. The component calls `GET /documents?q=<query>` and shows a dropdown of matching documents.
3. The user clicks a result; it appears as a chip below the search bar.
4. On save/dispatch, the selected document IDs are sent as the `references` array in the request body.
5. Backend inserts rows into `document_references` within the same transaction.

### 15.3 Detail View

The `DocumentDetail` page includes a **References** section listing all linked documents as clickable cards. Each card shows the reference document's subject, number, and status.

---

## 16. Multi-Destination (CC / BCC)

### 16.1 Purpose

A document may be dispatched to a primary receiver department and additionally carbon-copied (CC) or blind carbon-copied (BCC) to one or more other departments.

### 16.2 Behaviour

| Type | Visible to primary receiver | Visible to CC recipients | Visible to BCC recipients |
|---|---|---|---|
| **To** | ✅ | ✅ (see that they're CC'd) | ✅ (see that they're BCC'd) |
| **CC** | ✅ (sees CC list) | ✅ | ✅ |
| **BCC** | ❌ (not shown) | ❌ (not shown) | Only to own dept |

### 16.3 Dispatch Logic

When a document is dispatched:

1. The primary `receiver_department_id` is set on the `documents` table.
2. Backend inserts rows into `document_recipients` for each CC and BCC department.
3. Each CC/BCC department's inbox contains the document in `in_transit` status, just like the primary receiver.
4. When a worker in a CC/BCC department picks up the document, an inward number is generated for that department and stored in `document_recipients.inward_number`.
5. BCC departments are excluded from the visible recipient list returned to primary and CC recipients.

### 16.4 API Fields

```json
{
  "receiver_department_id": 5,
  "cc": [2, 7],
  "bcc": [4]
}
```

---

## 17. Audit Logging

Every meaningful system event writes a row to `audit_logs` within the same transaction as the primary operation.

### Audit Action Strings

**Phase 1 (retained):**

| Action | Description |
|---|---|
| `document.created` | Document dispatched. |
| `document.picked_up` | Worker/officer/assistant picked up a document. |
| `document.started` | Status changed to `in_progress`. |
| `document.forwarded` | Document forwarded to another department. |
| `document.completed` | Document marked completed. |
| `user.created` | New user created by SA. |
| `user.password_reset` | SA reset a user's password. |
| `user.password_changed` | User changed own password. |
| `department.created` | New department created. |
| `department.updated` | Department updated. |

**Phase 1.1 (new):**

| Action | Description |
|---|---|
| `draft.saved` | Draft created or updated. |
| `draft.submitted` | Assistant submitted draft to officer. |
| `draft.approved` | Officer approved draft; document dispatched. |
| `draft.revision_requested` | Officer sent draft back with a revision note. |
| `draft.deleted` | Draft deleted by creator. |
| `otp.requested` | Assistant requested an OTP for delegated send. |
| `otp.verified` | OTP successfully verified; document dispatched on behalf of officer. |
| `otp.expired` | OTP expired without use (recorded at time of next request). |
| `document.sent_on_behalf` | Document dispatched by assistant on behalf of officer via OTP. |
| `document.restricted` | Document marked as restricted on creation. |

### Metadata Examples

**`draft.approved`**
```json
{
  "draft_id": 45,
  "approved_by": { "id": 12, "name": "DIG IT" },
  "submitted_by": { "id": 19, "name": "Ravi Sharma" },
  "receiver_department": "CID",
  "outward_number": "DIG/OUT/2026/0004"
}
```

**`otp.verified`**
```json
{
  "document_id": 201,
  "officer_id": 12,
  "assistant_id": 19,
  "dispatched_at": "2026-03-30T14:22:11Z"
}
```

---

## 18. Environment Configuration

```env
# server/.env

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=edms_db
DB_USER=edms_user
DB_PASS=secret

# JWT
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRY=8h

# Node Mailer (SMTP)
SMTP_HOST=smtp.yourprovider.com
SMTP_PORT=587
SMTP_USER=no-reply@edms.local
SMTP_PASS=smtp_password
SMTP_FROM="EDMS System <no-reply@edms.local>"

# App
PORT=4000
NODE_ENV=development
UPLOAD_DIR=./uploads

# OTP
OTP_TTL_MINUTES=10
```

```env
# client/.env
VITE_API_BASE_URL=http://localhost:4000/api/v1
```

---

## 19. Build & Run Instructions

```bash
# 1. Clone repository
git clone https://github.com/your-org/edms.git
cd edms

# 2. Install server dependencies
cd server && npm install

# 3. Create database and run schema
psql -U postgres -c "CREATE DATABASE edms_db;"
psql -U postgres -d edms_db -f sql/schema.sql
psql -U postgres -d edms_db -f sql/seed.sql

# 4. Configure environment
cp .env.example .env
# Edit .env with your values

# 5. Start server
npm run dev

# 6. Install client dependencies (in new terminal)
cd ../client && npm install

# 7. Start client
npm run dev
```

Default Super Admin credentials (from seed.sql):
- **Email:** `admin@edms.local`
- **Password:** `Admin@1234` (change on first login)

---

## 20. Phase 2 Hooks

- **Storage:** `utils/storage.js` abstraction ready for S3.
- **Search:** `search_vector` column and GIN index in `documents` table for full-text search.
- **OCR:** `ocr_queue` table for background processing.
- **Self-Service Officer Authority:** Allow officers to grant/revoke `can_send_on_behalf` without SA involvement.
- **Email Notifications:** Extend Node Mailer for draft submission and revision notifications (currently in-app only).
- **Visual API Book:** Planned deliverable `Doc/V1.1/API_BOOK.md` for visual request/response documentation.
- **BCC Audit Trail:** Separate BCC visibility enforcement for super admin audit view.
- **Reference Graph View:** Visual graph of document reference chains.

---

## 21. Project Governance & Implementation Logs

### Implementation Log

| Milestone | Activity | Date | Developer |
|---|---|---|---|
| **0** | Planning & Governance (Specs, Skills, Constitution) | 2026-03-30 | AI Architect |
| **1** | Database Schema & Backend Foundation | 2026-03-30 | Senior AI Engineer |
| **2** | Identity, Admin Modules & Audit Logger | 2026-03-30 | Senior AI Engineer |
| **3** | Core Document Routing (Numbering, Creation, Pickup) | 2026-03-30 | Senior AI Engineer |
| **4** | Document Lifecycle (Forwarding, Processing) | 2026-03-30 | Senior AI Engineer |
| **5** | React Frontend & E2E Validation | 2026-03-30 | Senior AI Engineer |
| **6** | Phase 1.1 Planning — Compose, Drafts, Roles, OTP, Restrictions, CC/BCC, References | 2026-03-31 | AI Architect |

### Key Technical Decisions

- **PostgreSQL Transactions:** Ensures atomic document state changes and audit logs.
- **Atomic Pickup:** Prevents race conditions and duplicate assignments.
- **Crypto-based Passwords:** Uses Node's `crypto` module for unpredictable temporary credentials.
- **Stateless JWT:** Reduces server overhead while maintaining secure role-based access.
- **Tiptap for Rich Text:** Headless, extensible, React-native ProseMirror wrapper. Avoids heavy dependencies like Quill or CKEditor while providing full formatting control.
- **OTP over Full Approval for Speed:** The OTP-delegated send path is designed for scenarios where officers are busy. It keeps the security layer (officer's email acts as the second factor) without requiring the officer to log into the system.
- **Server-Side Restriction Enforcement:** Document body redaction is performed on the backend; the client never receives restricted content for unauthorised users, preventing any client-side bypass.
- **BCC Stored Separately:** BCC departments are stored in `document_recipients` rather than on the main `documents` table, keeping the primary record clean and allowing future per-recipient metadata (e.g., per-recipient inward numbers).

---

*End of Project Documentation — EDMS Phase 1.1 v1.0*