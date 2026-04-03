-- EDMS Phase 1.1 Schema (Final Position-Based Architecture)
-- Fresh Start Script

-- Cleanup existing structures
DROP TABLE IF EXISTS legacy_imports;
DROP TABLE IF EXISTS ocr_queue;
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS document_forwards;
DROP TABLE IF EXISTS document_otps;
DROP TABLE IF EXISTS document_references;
DROP TABLE IF EXISTS document_recipients;
DROP TABLE IF EXISTS doc_number_sequences;
DROP TABLE IF EXISTS documents;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS positions;
DROP TABLE IF EXISTS departments;

DROP TYPE IF EXISTS recipient_type;
DROP TYPE IF EXISTS doc_status;
DROP TYPE IF EXISTS user_role;

-- 1. Departments
CREATE TABLE departments (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(255) NOT NULL UNIQUE,
  code        VARCHAR(50)  NOT NULL UNIQUE,
  is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 2. Positions
CREATE TYPE user_role AS ENUM ('super_admin', 'worker', 'officer', 'assistant');

CREATE TABLE positions (
  id              SERIAL PRIMARY KEY,
  title           VARCHAR(255) NOT NULL,
  role            user_role    NOT NULL,
  department_id   INT          NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  parent_id       INT          REFERENCES positions(id) ON DELETE SET NULL,
  can_send_on_behalf BOOLEAN   NOT NULL DEFAULT FALSE,
  is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 3. Users
CREATE TABLE users (
  id              SERIAL PRIMARY KEY,
  name            VARCHAR(255)  NOT NULL,
  email           VARCHAR(255)  NOT NULL UNIQUE,
  password_hash   TEXT          NOT NULL,
  role            user_role     NOT NULL,
  department_id   INT           REFERENCES departments(id) ON DELETE SET NULL,
  position_id     INT           REFERENCES positions(id) ON DELETE SET NULL,
  can_send_on_behalf BOOLEAN    NOT NULL DEFAULT FALSE,
  signature_path     TEXT,
  is_active       BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT worker_must_have_department
    CHECK (role = 'super_admin' OR department_id IS NOT NULL),
  CONSTRAINT assistant_must_have_position
    CHECK (role != 'assistant' OR position_id IS NOT NULL)
);

-- 4. Documents
CREATE TYPE doc_status AS ENUM (
  'draft',
  'in_transit',
  'picked_up',
  'in_progress',
  'forwarded',
  'completed'
);

CREATE TABLE documents (
  id                      SERIAL PRIMARY KEY,
  subject                 VARCHAR(500)  NOT NULL,
  body_html               TEXT,
  body                    TEXT,
  file_path               TEXT,

  status                  doc_status    NOT NULL DEFAULT 'draft',

  -- Parties
  created_by              INT           NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender_department_id    INT           NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  receiver_department_id  INT           NOT NULL REFERENCES departments(id) ON DELETE CASCADE,

  -- Self-assignment
  assigned_to             INT           REFERENCES users(id) ON DELETE SET NULL,
  picked_up_at            TIMESTAMPTZ,

  -- On-behalf-of
  behalf_of_position_id   INT           REFERENCES positions(id) ON DELETE SET NULL,
  behalf_approved         BOOLEAN       NOT NULL DEFAULT FALSE,
  behalf_otp_used         BOOLEAN       NOT NULL DEFAULT FALSE,

  -- Draft review
  draft_revision_note     TEXT,
  draft_submitted_by      INT           REFERENCES users(id) ON DELETE SET NULL,
  draft_submitted_at      TIMESTAMPTZ,

  -- Access restriction
  is_restricted           BOOLEAN       NOT NULL DEFAULT FALSE,
  restricted_to_user_id   INT           REFERENCES users(id) ON DELETE SET NULL,

  -- Numbering
  outward_number          VARCHAR(100),
  inward_number           VARCHAR(100),

  created_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- 5. Document Number Sequences
CREATE TABLE doc_number_sequences (
  id              SERIAL PRIMARY KEY,
  department_id   INT         NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  direction       VARCHAR(10) NOT NULL CHECK (direction IN ('inward', 'outward')),
  year            SMALLINT    NOT NULL,
  last_number     INT         NOT NULL DEFAULT 0,
  UNIQUE (department_id, direction, year)
);

-- 6. Document Recipients (CC/BCC)
CREATE TYPE recipient_type AS ENUM ('cc', 'bcc');

CREATE TABLE document_recipients (
  id                    SERIAL PRIMARY KEY,
  document_id           INT             NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  department_id         INT             NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  recipient_type        recipient_type  NOT NULL,
  inward_number         VARCHAR(100),
  picked_up_at          TIMESTAMPTZ,
  picked_up_by          INT             REFERENCES users(id) ON DELETE SET NULL,
  status                doc_status      NOT NULL DEFAULT 'in_transit',
  created_at            TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  UNIQUE (document_id, department_id, recipient_type)
);

CREATE INDEX idx_doc_recipients_pickup ON document_recipients(document_id, department_id);

-- 7. Document References
CREATE TABLE document_references (
  id              SERIAL PRIMARY KEY,
  document_id     INT  NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  reference_id    INT  NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (document_id, reference_id),
  CHECK (document_id != reference_id)
);

-- 8. OTP Store
CREATE TABLE document_otps (
  id                    SERIAL PRIMARY KEY,
  document_id           INT          NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  officer_id            INT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assistant_id          INT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  officer_position_id   INT          REFERENCES positions(id) ON DELETE CASCADE,
  assistant_position_id INT          REFERENCES positions(id) ON DELETE CASCADE,
  otp_hash              TEXT         NOT NULL,
  expires_at            TIMESTAMPTZ  NOT NULL,
  used                  BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 9. Document Forwarding History
CREATE TABLE document_forwards (
  id                    SERIAL PRIMARY KEY,
  document_id           INT           NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  from_user_id          INT           NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  from_department_id    INT           NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  to_department_id      INT           NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  note                  TEXT,
  new_outward_number    VARCHAR(100),
  forwarded_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- 10. Audit Logs
CREATE TABLE audit_logs (
  id            SERIAL PRIMARY KEY,
  actor_id      INT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  position_id   INT          REFERENCES positions(id) ON DELETE SET NULL, -- Enhanced Accountability
  action        VARCHAR(100) NOT NULL,
  entity_type   VARCHAR(50)  NOT NULL,
  entity_id     INT,
  metadata      JSONB,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_actor   ON audit_logs(actor_id);
CREATE INDEX idx_audit_position ON audit_logs(position_id);
CREATE INDEX idx_audit_entity  ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);

-- 11. Sync Triggers (Position -> User Integrity)
CREATE OR REPLACE FUNCTION sync_user_with_position()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.position_id IS NOT NULL THEN
    UPDATE users 
    SET role = p.role,
        department_id = p.department_id,
        can_send_on_behalf = p.can_send_on_behalf
    FROM positions p
    WHERE users.id = NEW.id AND p.id = NEW.position_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_user_position
AFTER INSERT OR UPDATE OF position_id ON users
FOR EACH ROW EXECUTE FUNCTION sync_user_with_position();

CREATE OR REPLACE FUNCTION sync_all_users_on_position_change()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users 
  SET role = NEW.role,
      department_id = NEW.department_id,
      can_send_on_behalf = NEW.can_send_on_behalf
  WHERE position_id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_position_changes
AFTER UPDATE OF role, department_id, can_send_on_behalf ON positions
FOR EACH ROW EXECUTE FUNCTION sync_all_users_on_position_change();

-- Future Hooks
ALTER TABLE documents ADD COLUMN search_vector TSVECTOR;
CREATE INDEX idx_documents_search ON documents USING GIN(search_vector);

CREATE TABLE ocr_queue (
  id            SERIAL PRIMARY KEY,
  document_id   INT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  status        VARCHAR(20) NOT NULL DEFAULT 'pending',
  result_text   TEXT,
  queued_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at  TIMESTAMPTZ
);

CREATE TABLE legacy_imports (
  id            SERIAL PRIMARY KEY,
  source        VARCHAR(100),
  raw_data      JSONB,
  document_id   INT REFERENCES documents(id) ON DELETE CASCADE,
  imported_by   INT REFERENCES users(id) ON DELETE CASCADE,
  imported_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
