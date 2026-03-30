-- Seed initial Super Admin
-- Password: Admin@1234
INSERT INTO users (name, email, password_hash, role, department_id)
VALUES (
  'System Super Admin',
  'superadmin@edms.local',
  '$2b$10$TsUmLpzdvOsxqxGNTSznxukneCnKVTARK1UfILes8ZQ5D2BwQDOVO', -- Correct hash for 'Admin@1234'
  'super_admin',
  NULL
)
ON CONFLICT (email) DO UPDATE 
SET password_hash = EXCLUDED.password_hash,
    name = EXCLUDED.name,
    role = EXCLUDED.role;

