-- V10.2__seed_permissions.sql
-- Static permission catalogue. These rows are never modified at runtime.
-- Roles are assigned permissions from this catalogue via role_permissions.

INSERT INTO permissions (module, action, scope, description) VALUES
-- ── Devotee ────────────────────────────────────────────────────────────────
('devotee', 'read',   'own',    'Read own devotee profile'),
('devotee', 'read',   'centre', 'Read all devotee profiles in own centre'),
('devotee', 'read',   'all',    'Read devotee profiles across all centres'),
('devotee', 'write',  'own',    'Edit own devotee profile'),
('devotee', 'write',  'centre', 'Edit any devotee profile in own centre'),
('devotee', 'delete', 'centre', 'Soft-delete a devotee in own centre'),

-- ── Sadhana ────────────────────────────────────────────────────────────────
('sadhana', 'read',   'own',     'Read own sadhana records'),
('sadhana', 'read',   'mentees', 'Read mentees'' sadhana records'),
('sadhana', 'read',   'centre',  'Read all sadhana records in own centre'),
('sadhana', 'write',  'own',     'Submit own sadhana record'),
('sadhana', 'write',  'mentees', 'Submit sadhana on behalf of mentees'),

-- ── Events ─────────────────────────────────────────────────────────────────
('event',      'read',  'centre', 'Read events in own centre'),
('event',      'write', 'centre', 'Create/edit events in own centre'),
('event',      'delete','centre', 'Cancel/delete events in own centre'),
('attendance', 'write', 'centre', 'Mark attendance for any session'),
('attendance', 'read',  'centre', 'View attendance reports'),

-- ── Career ─────────────────────────────────────────────────────────────────
('career', 'read',   'centre',       'Read job posts in own centre'),
('career', 'write',  'centre',       'Post/edit jobs in own centre'),
('career', 'apply',  'own',          'Apply for a job'),
('career', 'read',   'applications', 'View job applications (recruiter)'),

-- ── Seva ───────────────────────────────────────────────────────────────────
('seva', 'read',   'centre', 'Read seva opportunities in own centre'),
('seva', 'write',  'centre', 'Create/edit seva opportunities'),
('seva', 'enroll', 'own',    'Enroll self in seva'),

-- ── Preaching ──────────────────────────────────────────────────────────────
('preaching', 'read',  'own',    'Read own preaching contacts'),
('preaching', 'read',  'centre', 'Read all preaching contacts in own centre'),
('preaching', 'write', 'own',    'Add/edit own preaching contacts'),
('preaching', 'write', 'centre', 'Edit any preaching contact in own centre'),

-- ── Communication ──────────────────────────────────────────────────────────
('communication', 'read',  'centre', 'Read group messages in own centre'),
('communication', 'write', 'centre', 'Send messages in groups'),

-- ── Notifications ──────────────────────────────────────────────────────────
('notification', 'read',  'own',    'Read own notifications'),
('notification', 'write', 'centre', 'Send announcements to centre'),

-- ── Reporting ──────────────────────────────────────────────────────────────
('reporting', 'read',   'centre', 'View reports for own centre'),
('reporting', 'export', 'centre', 'Export data for own centre'),
('reporting', 'read',   'all',    'View system-wide reports'),

-- ── Admin ──────────────────────────────────────────────────────────────────
('admin',   'manage', 'centre', 'Full admin access for own centre'),
('admin',   'manage', 'all',    'Full system admin access'),
('centre',  'write',  'all',    'Create/modify centre records'),
('user',    'manage', 'centre', 'Manage users in own centre'),
('role',    'assign', 'centre', 'Assign roles within own centre')

ON CONFLICT DO NOTHING;
