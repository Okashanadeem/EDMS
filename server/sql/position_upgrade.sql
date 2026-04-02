-- Migration to Position-Based Architecture

-- 1. Create Positions Table
CREATE TABLE positions (
  id              SERIAL PRIMARY KEY,
  title           VARCHAR(255) NOT NULL,
  role            user_role    NOT NULL,
  department_id   INT          NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  parent_id       INT          REFERENCES positions(id) ON DELETE SET NULL, -- Assistant -> Officer position
  can_send_on_behalf BOOLEAN   NOT NULL DEFAULT FALSE,
  is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 2. Update Users Table
ALTER TABLE users ADD COLUMN position_id INT REFERENCES positions(id) ON DELETE SET NULL;
-- Note: We keep role/department_id/officer_id/can_send_on_behalf for now to avoid breaking existing queries, 
-- but we will migrate data and then potentially deprecate them.

-- 3. Update Documents Table
ALTER TABLE documents ADD COLUMN behalf_of_position_id INT REFERENCES positions(id) ON DELETE SET NULL;
-- Migration logic will map behalf_of_officer_id (user) to the position they held.

-- 4. Update OTP Table
ALTER TABLE document_otps ADD COLUMN officer_position_id INT REFERENCES positions(id);
ALTER TABLE document_otps ADD COLUMN assistant_position_id INT REFERENCES positions(id);
