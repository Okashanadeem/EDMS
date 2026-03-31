-- EDMS Phase 1.1 Schema Update (Fixed for ENUM limitation)

-- 1. Update Enums (Must be committed before use)
-- Note: These cannot be inside a BEGIN/COMMIT block if they are used in the same script
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'officer';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'assistant';
ALTER TYPE doc_status ADD VALUE IF NOT EXISTS 'draft';

-- 2. Update Users Table
ALTER TABLE users ADD COLUMN IF NOT EXISTS officer_id INT REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS can_send_on_behalf BOOLEAN NOT NULL DEFAULT FALSE;

-- Update constraints for users
ALTER TABLE users DROP CONSTRAINT IF EXISTS worker_must_have_department;
ALTER TABLE users ADD CONSTRAINT worker_must_have_department
    CHECK (role = 'super_admin' OR department_id IS NOT NULL);

ALTER TABLE users DROP CONSTRAINT IF EXISTS assistant_must_have_officer;
ALTER TABLE users ADD CONSTRAINT assistant_must_have_officer
    CHECK (role != 'assistant' OR officer_id IS NOT NULL);

-- 3. Update Documents Table
ALTER TABLE documents ADD COLUMN IF NOT EXISTS body_html TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS behalf_of_officer_id INT REFERENCES users(id);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS behalf_approved BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS behalf_otp_used BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS draft_revision_note TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS draft_submitted_by INT REFERENCES users(id);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS draft_submitted_at TIMESTAMPTZ;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS is_restricted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS restricted_to_user_id INT REFERENCES users(id);

-- 4. Create New Recipient Enum and Table
DO $$ BEGIN
    CREATE TYPE recipient_type AS ENUM ('cc', 'bcc');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS document_recipients (
  id                    SERIAL PRIMARY KEY,
  document_id           INT             NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  department_id         INT             NOT NULL REFERENCES departments(id),
  recipient_type        recipient_type  NOT NULL,
  inward_number         VARCHAR(100),
  created_at            TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  UNIQUE (document_id, department_id, recipient_type)
);

-- 5. Create Document References Table
CREATE TABLE IF NOT EXISTS document_references (
  id              SERIAL PRIMARY KEY,
  document_id     INT  NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  reference_id    INT  NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (document_id, reference_id),
  CHECK (document_id != reference_id)
);

-- 6. Create OTP Store Table
CREATE TABLE IF NOT EXISTS document_otps (
  id              SERIAL PRIMARY KEY,
  document_id     INT          NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  officer_id      INT          NOT NULL REFERENCES users(id),
  assistant_id    INT          NOT NULL REFERENCES users(id),
  otp_hash        TEXT         NOT NULL,
  expires_at      TIMESTAMPTZ  NOT NULL,
  used            BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
