-- V1.2__create_identity_tables.sql
-- Users, Roles, Permissions and their junction tables.

-- ─────────────────────────────────────────────────────────────────────────────
-- ENUM TYPES
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TYPE user_status AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION');
CREATE TYPE gender_type  AS ENUM ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY');

-- ─────────────────────────────────────────────────────────────────────────────
-- USERS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE users (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    centre_id           UUID            NOT NULL REFERENCES centres(id),
    email               VARCHAR(255)    NOT NULL,
    password_hash       VARCHAR(255)    NOT NULL,
    phone               VARCHAR(20),
    status              user_status     NOT NULL DEFAULT 'PENDING_VERIFICATION',
    email_verified_at   TIMESTAMPTZ,
    last_login_at       TIMESTAMPTZ,
    failed_login_count  SMALLINT        NOT NULL DEFAULT 0,
    locked_until        TIMESTAMPTZ,

    -- Audit fields
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    created_by          UUID,           -- self-referencing FK added below
    updated_by          UUID,

    -- Soft delete
    deleted_at          TIMESTAMPTZ,
    deleted_by          UUID
);

-- Active email must be globally unique
CREATE UNIQUE INDEX uq_users_email
    ON users(email)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_users_centre_id    ON users(centre_id);
CREATE INDEX idx_users_status       ON users(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_email_login  ON users(email);

SELECT attach_updated_at_trigger('users');

-- Add self-referencing FKs now that table exists
ALTER TABLE users
    ADD CONSTRAINT fk_users_created_by FOREIGN KEY (created_by) REFERENCES users(id),
    ADD CONSTRAINT fk_users_updated_by FOREIGN KEY (updated_by) REFERENCES users(id),
    ADD CONSTRAINT fk_users_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(id);

-- Back-fill FKs on centres (users table now exists)
ALTER TABLE centres
    ADD CONSTRAINT fk_centres_created_by FOREIGN KEY (created_by) REFERENCES users(id),
    ADD CONSTRAINT fk_centres_updated_by FOREIGN KEY (updated_by) REFERENCES users(id),
    ADD CONSTRAINT fk_centres_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(id);

COMMENT ON TABLE users IS 'Authentication identities. 1:1 with devotee_profiles for devotee users.';
COMMENT ON COLUMN users.locked_until IS 'Set to a future timestamp after multiple failed login attempts.';

-- ─────────────────────────────────────────────────────────────────────────────
-- REFRESH_TOKENS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE refresh_tokens (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID            NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash      VARCHAR(255)    NOT NULL,
    device_info     VARCHAR(255),
    ip_address      INET,
    issued_at       TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    expires_at      TIMESTAMPTZ     NOT NULL,
    revoked_at      TIMESTAMPTZ,
    revoked_reason  VARCHAR(100)
);

CREATE UNIQUE INDEX uq_refresh_tokens_hash ON refresh_tokens(token_hash);
CREATE INDEX idx_refresh_tokens_user_id    ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

COMMENT ON TABLE refresh_tokens IS 'Hashed refresh JWT strings. Expired rows cleaned by scheduler.';

-- ─────────────────────────────────────────────────────────────────────────────
-- ROLES
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE roles (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(60)     NOT NULL,
    description     VARCHAR(255),
    centre_id       UUID            REFERENCES centres(id),   -- NULL = system-wide
    is_system_role  BOOLEAN         NOT NULL DEFAULT FALSE,

    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    created_by      UUID            REFERENCES users(id),
    updated_by      UUID            REFERENCES users(id),

    deleted_at      TIMESTAMPTZ,
    deleted_by      UUID            REFERENCES users(id)
);

-- Role name unique per scope (NULL centre = global)
CREATE UNIQUE INDEX uq_roles_name_centre
    ON roles(name, COALESCE(centre_id, '00000000-0000-0000-0000-000000000000'::UUID))
    WHERE deleted_at IS NULL;

CREATE INDEX idx_roles_centre_id ON roles(centre_id);
SELECT attach_updated_at_trigger('roles');

-- ─────────────────────────────────────────────────────────────────────────────
-- PERMISSIONS  (static catalogue — seeded by Flyway V10.2)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE permissions (
    id          UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    module      VARCHAR(60)     NOT NULL,
    action      VARCHAR(60)     NOT NULL,
    scope       VARCHAR(60),
    description VARCHAR(255),
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX uq_permissions_module_action_scope
    ON permissions(module, action, COALESCE(scope, ''));

COMMENT ON TABLE permissions IS 'Immutable catalogue seeded by Flyway. Never modified at runtime.';

-- ─────────────────────────────────────────────────────────────────────────────
-- ROLE_PERMISSIONS  (join: roles ↔ permissions)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE role_permissions (
    role_id         UUID    NOT NULL REFERENCES roles(id)       ON DELETE CASCADE,
    permission_id   UUID    NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by      UUID        REFERENCES users(id),
    PRIMARY KEY (role_id, permission_id)
);

CREATE INDEX idx_role_permissions_permission_id ON role_permissions(permission_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- USER_ROLES  (join: users ↔ roles, scoped to a centre)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE user_roles (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID        NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
    role_id         UUID        NOT NULL REFERENCES roles(id)   ON DELETE CASCADE,
    centre_id       UUID        NOT NULL REFERENCES centres(id),
    assigned_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    assigned_by     UUID        REFERENCES users(id),
    revoked_at      TIMESTAMPTZ,
    revoked_by      UUID        REFERENCES users(id)
);

-- Prevent duplicate active role assignment per user per centre
CREATE UNIQUE INDEX uq_user_roles_active
    ON user_roles(user_id, role_id, centre_id)
    WHERE revoked_at IS NULL;

CREATE INDEX idx_user_roles_user_id    ON user_roles(user_id);
CREATE INDEX idx_user_roles_centre_id  ON user_roles(centre_id);
CREATE INDEX idx_user_roles_role_id    ON user_roles(role_id);
