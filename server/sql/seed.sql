-- Seed initial Super Admin
-- Password: Admin@1234 (Bcrypt hash below is a placeholder; replace with actual hash in production)
INSERT INTO users (name, email, password_hash, role, department_id)
VALUES (
  'System Super Admin',
  'superadmin@edms.local',
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- placeholder for 'Admin@1234'
  'super_admin',
  NULL
);
