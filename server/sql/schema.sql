-- EDMS Phase 1 MVP Schema

-- 1. Departments
CREATE TABLE departments (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(255) NOT NULL UNIQUE,
  code        VARCHAR(50)  NOT NULL UNIQUE,   -- Short code used in numbering, e.g. "CID"
  is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 2. Users
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

-- 3. Documents
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

-- 4. Document Number Sequences
CREATE TABLE doc_number_sequences (
  id              SERIAL PRIMARY KEY,
  department_id   INT         NOT NULL REFERENCES departments(id),
  direction       VARCHAR(10) NOT NULL CHECK (direction IN ('inward', 'outward')),
  year            SMALLINT    NOT NULL,
  last_number     INT         NOT NULL DEFAULT 0,
  UNIQUE (department_id, direction, year)
);

-- 5. Document Forwarding History
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

-- 6. Audit Logs
CREATE TABLE audit_logs (
  id            SERIAL PRIMARY KEY,
  actor_id      INT          NOT NULL REFERENCES users(id),
  action        VARCHAR(100) NOT NULL,    -- e.g. 'document.created', 'document.picked_up'
  entity_type   VARCHAR(50)  NOT NULL,    -- e.g. 'document', 'user', 'department'
  entity_id     INT,
  metadata      JSONB,                    -- Contextual snapshot
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_actor   ON audit_logs(actor_id);
CREATE INDEX idx_audit_entity  ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);

-- Phase 2 Hooks (Stubs)
ALTER TABLE documents ADD COLUMN search_vector TSVECTOR;
CREATE INDEX idx_documents_search ON documents USING GIN(search_vector);

CREATE TABLE ocr_queue (
  id            SERIAL PRIMARY KEY,
  document_id   INT NOT NULL REFERENCES documents(id),
  status        VARCHAR(20) NOT NULL DEFAULT 'pending',  -- pending, processing, done, failed
  result_text   TEXT,
  queued_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at  TIMESTAMPTZ
);

CREATE TABLE legacy_imports (
  id            SERIAL PRIMARY KEY,
  source        VARCHAR(100),           -- 'paper_register', 'spreadsheet', 'email_archive'
  raw_data      JSONB,
  document_id   INT REFERENCES documents(id),
  imported_by   INT REFERENCES users(id),
  imported_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
