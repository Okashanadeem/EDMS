-- EDMS Seed Data (Initial Super Admin)
-- Default Password: Admin@1234

INSERT INTO users (
  name, 
  email, 
  password_hash, 
  role, 
  department_id, 
  position_id, 
  can_send_on_behalf, 
  is_active
)
VALUES (
  'System Super Admin',
  'superadmin@edms.local',
  '$2b$10$TsUmLpzdvOsxqxGNTSznxukneCnKVTARK1UfILes8ZQ5D2BwQDOVO', -- Bcrypt hash for 'Admin@1234'
  'super_admin',
  NULL,
  NULL,
  FALSE,
  TRUE
)
ON CONFLICT (email) DO UPDATE 
SET password_hash = EXCLUDED.password_hash,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active;
