-- V10.3__seed_default_roles.sql
-- Seed the 7 system-wide roles and assign permissions to each.

-- ─────────────────────────────────────────────────────────────────────────────
-- Insert system-wide roles (centre_id = NULL = available to all centres)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO roles (name, description, centre_id, is_system_role) VALUES
('SUPER_ADMIN',       'Full system access across all centres',                   NULL, TRUE),
('CENTRE_ADMIN',      'Full access within their own centre',                     NULL, TRUE),
('COUNSELLOR',        'Manage assigned devotees, sadhana and follow-ups',        NULL, TRUE),
('EVENT_MANAGER',     'Create and manage events, sessions and attendance',       NULL, TRUE),
('SEVA_COORDINATOR',  'Manage seva opportunities and volunteer enrollments',     NULL, TRUE),
('OUTREACH_OFFICER',  'Manage preaching contacts and follow-up pipeline',        NULL, TRUE),
('DEVOTEE',           'Base role: own profile, sadhana submission, event reg.',  NULL, TRUE)
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- Helper function: assign permission(s) to a role by name
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION seed_role_permission(
    p_role_name TEXT,
    p_module    TEXT,
    p_action    TEXT,
    p_scope     TEXT DEFAULT NULL
) RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
    v_role_id       UUID;
    v_permission_id UUID;
BEGIN
    SELECT id INTO v_role_id FROM roles WHERE name = p_role_name AND centre_id IS NULL;
    IF v_role_id IS NULL THEN
        RAISE WARNING 'Role % not found', p_role_name;
        RETURN;
    END IF;

    FOR v_permission_id IN
        SELECT id FROM permissions
        WHERE module = p_module
          AND action = p_action
          AND (p_scope IS NULL OR scope = p_scope)
    LOOP
        INSERT INTO role_permissions (role_id, permission_id)
        VALUES (v_role_id, v_permission_id)
        ON CONFLICT DO NOTHING;
    END LOOP;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- SUPER_ADMIN → all permissions
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r CROSS JOIN permissions p
WHERE r.name = 'SUPER_ADMIN'
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- CENTRE_ADMIN → all centre-scoped permissions + reporting
-- ─────────────────────────────────────────────────────────────────────────────
SELECT seed_role_permission('CENTRE_ADMIN', 'devotee',       'read',   'centre');
SELECT seed_role_permission('CENTRE_ADMIN', 'devotee',       'write',  'centre');
SELECT seed_role_permission('CENTRE_ADMIN', 'devotee',       'delete', 'centre');
SELECT seed_role_permission('CENTRE_ADMIN', 'sadhana',       'read',   'centre');
SELECT seed_role_permission('CENTRE_ADMIN', 'event',         'write',  'centre');
SELECT seed_role_permission('CENTRE_ADMIN', 'event',         'delete', 'centre');
SELECT seed_role_permission('CENTRE_ADMIN', 'attendance',    'write',  'centre');
SELECT seed_role_permission('CENTRE_ADMIN', 'attendance',    'read',   'centre');
SELECT seed_role_permission('CENTRE_ADMIN', 'career',        'write',  'centre');
SELECT seed_role_permission('CENTRE_ADMIN', 'seva',          'write',  'centre');
SELECT seed_role_permission('CENTRE_ADMIN', 'preaching',     'read',   'centre');
SELECT seed_role_permission('CENTRE_ADMIN', 'preaching',     'write',  'centre');
SELECT seed_role_permission('CENTRE_ADMIN', 'reporting',     'read',   'centre');
SELECT seed_role_permission('CENTRE_ADMIN', 'reporting',     'export', 'centre');
SELECT seed_role_permission('CENTRE_ADMIN', 'notification',  'write',  'centre');
SELECT seed_role_permission('CENTRE_ADMIN', 'admin',         'manage', 'centre');
SELECT seed_role_permission('CENTRE_ADMIN', 'user',          'manage', 'centre');
SELECT seed_role_permission('CENTRE_ADMIN', 'role',          'assign', 'centre');
SELECT seed_role_permission('CENTRE_ADMIN', 'event',         'read',   'centre');

-- ─────────────────────────────────────────────────────────────────────────────
-- COUNSELLOR
-- ─────────────────────────────────────────────────────────────────────────────
SELECT seed_role_permission('COUNSELLOR', 'devotee',   'read',   'centre');
SELECT seed_role_permission('COUNSELLOR', 'devotee',   'write',  'own');
SELECT seed_role_permission('COUNSELLOR', 'sadhana',   'read',   'mentees');
SELECT seed_role_permission('COUNSELLOR', 'sadhana',   'write',  'mentees');
SELECT seed_role_permission('COUNSELLOR', 'preaching', 'read',   'centre');
SELECT seed_role_permission('COUNSELLOR', 'preaching', 'write',  'own');
SELECT seed_role_permission('COUNSELLOR', 'event',     'read',   'centre');
SELECT seed_role_permission('COUNSELLOR', 'notification','read', 'own');

-- ─────────────────────────────────────────────────────────────────────────────
-- EVENT_MANAGER
-- ─────────────────────────────────────────────────────────────────────────────
SELECT seed_role_permission('EVENT_MANAGER', 'event',      'read',   'centre');
SELECT seed_role_permission('EVENT_MANAGER', 'event',      'write',  'centre');
SELECT seed_role_permission('EVENT_MANAGER', 'event',      'delete', 'centre');
SELECT seed_role_permission('EVENT_MANAGER', 'attendance', 'write',  'centre');
SELECT seed_role_permission('EVENT_MANAGER', 'attendance', 'read',   'centre');
SELECT seed_role_permission('EVENT_MANAGER', 'devotee',    'read',   'centre');

-- ─────────────────────────────────────────────────────────────────────────────
-- SEVA_COORDINATOR
-- ─────────────────────────────────────────────────────────────────────────────
SELECT seed_role_permission('SEVA_COORDINATOR', 'seva',    'read',  'centre');
SELECT seed_role_permission('SEVA_COORDINATOR', 'seva',    'write', 'centre');
SELECT seed_role_permission('SEVA_COORDINATOR', 'devotee', 'read',  'centre');

-- ─────────────────────────────────────────────────────────────────────────────
-- OUTREACH_OFFICER
-- ─────────────────────────────────────────────────────────────────────────────
SELECT seed_role_permission('OUTREACH_OFFICER', 'preaching',     'read',  'centre');
SELECT seed_role_permission('OUTREACH_OFFICER', 'preaching',     'write', 'centre');
SELECT seed_role_permission('OUTREACH_OFFICER', 'communication', 'write', 'centre');
SELECT seed_role_permission('OUTREACH_OFFICER', 'devotee',       'read',  'centre');

-- ─────────────────────────────────────────────────────────────────────────────
-- DEVOTEE (base role)
-- ─────────────────────────────────────────────────────────────────────────────
SELECT seed_role_permission('DEVOTEE', 'devotee',      'read',   'own');
SELECT seed_role_permission('DEVOTEE', 'devotee',      'write',  'own');
SELECT seed_role_permission('DEVOTEE', 'sadhana',      'read',   'own');
SELECT seed_role_permission('DEVOTEE', 'sadhana',      'write',  'own');
SELECT seed_role_permission('DEVOTEE', 'event',        'read',   'centre');
SELECT seed_role_permission('DEVOTEE', 'career',       'read',   'centre');
SELECT seed_role_permission('DEVOTEE', 'career',       'apply',  'own');
SELECT seed_role_permission('DEVOTEE', 'seva',         'read',   'centre');
SELECT seed_role_permission('DEVOTEE', 'seva',         'enroll', 'own');
SELECT seed_role_permission('DEVOTEE', 'notification', 'read',   'own');
SELECT seed_role_permission('DEVOTEE', 'communication','read',   'centre');
SELECT seed_role_permission('DEVOTEE', 'communication','write',  'centre');
