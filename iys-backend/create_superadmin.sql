-- 1. Create Default Base/HQ Centre if not exists
INSERT INTO centres (name, short_code, city, country, is_active)
VALUES ('ISKCON Central Admin', 'HQ', 'Mayapur', 'India', TRUE)
ON CONFLICT (short_code) DO NOTHING;

-- 2. Create or Update Super Admin User
INSERT INTO users (centre_id, email, password_hash, phone, status, email_verified_at)
SELECT 
    c.id,
    'superadmin@iys.org',
    crypt('Admin@123', gen_salt('bf', 10)),
    '+919876543210',
    'ACTIVE'::user_status,
    NOW()
FROM centres c
WHERE c.short_code = 'HQ'
  AND NOT EXISTS (SELECT 1 FROM users WHERE email = 'superadmin@iys.org');

-- If already exists, update status to ACTIVE and reset password
UPDATE users 
SET status = 'ACTIVE',
    password_hash = crypt('Admin@123', gen_salt('bf', 10))
WHERE email = 'superadmin@iys.org';

-- 3. Assign SUPER_ADMIN role
INSERT INTO user_roles (user_id, role_id, centre_id, assigned_at)
SELECT 
    u.id,
    r.id,
    u.centre_id,
    NOW()
FROM users u
CROSS JOIN roles r
WHERE u.email = 'superadmin@iys.org'
  AND r.name = 'SUPER_ADMIN'
  AND r.centre_id IS NULL
  AND NOT EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = u.id AND ur.role_id = r.id AND ur.revoked_at IS NULL
  );

-- 4. Display result
SELECT u.email, u.status, r.name AS role_name, c.name AS centre_name
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
JOIN centres c ON u.centre_id = c.id
WHERE u.email = 'superadmin@iys.org';
