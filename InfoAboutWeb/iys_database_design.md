# IYS Platform — PostgreSQL Database Design

> **Engine**: PostgreSQL 16 · **Migration tool**: Flyway · **ID strategy**: UUID v4
> **Pattern**: Soft-delete + Audit fields + Centre-scoped multi-tenancy

---

## Part 1 — ER Relationship Description

### Domain Map

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  DOMAIN              ENTITIES                                                │
├──────────────────────────────────────────────────────────────────────────────┤
│  Identity & Access   Centre, User, Role, Permission,                         │
│                      RolePermission, UserRole, RefreshToken                  │
│                                                                              │
│  Devotee             DevoteeProfile, StudentProfile,                         │
│                      ProfessionalProfile, AlumniProfile,                     │
│                      Skill, DevoteeSkill, MentorAssignment,                  │
│                      DevoteeRelationship                                     │
│                                                                              │
│  Sadhana             SadhanaTemplate, SadhanaTemplateItem,                  │
│                      SadhanaRecord, SadhanaScore                             │
│                                                                              │
│  Events & Attendance Event, Session, EventRegistration,                      │
│                      AttendanceRecord                                        │
│                                                                              │
│  Career              JobPost, JobApplication, Referral                       │
│                                                                              │
│  Seva                SevaOpportunity, SevaEnrollment                        │
│                                                                              │
│  Communication       CommunicationGroup, GroupMember,                       │
│                      GroupMessage                                            │
│                                                                              │
│  Notification        Notification, NotificationPreference                   │
│                                                                              │
│  Preaching           PreachingContact, ContactFollowup                      │
│                                                                              │
│  Audit               AuditLog                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Relationship Narrative

#### Identity & Access

- **Centre** is the top-level tenant. Every piece of data ultimately traces to a Centre.
- **User** belongs to exactly one home Centre (`centre_id`). A user authenticates with email + password. One User maps to at most one DevoteeProfile.
- **Role** is either system-wide (centre_id IS NULL, e.g. `SUPER_ADMIN`) or centre-scoped (e.g. `CENTRE_ADMIN`, `COUNSELLOR`).
- **Permission** is a granular action token: `module:action` (e.g. `devotee:read`, `event:write`). Permissions are static — seeded, not user-created.
- **UserRole** is a three-way junction: User × Role × Centre. A user can be `EVENT_MANAGER` in Centre A and only `DEVOTEE` in Centre B.
- **RolePermission** maps which permissions belong to which role.
- **RefreshToken** stores the hashed refresh JWT, bound to a User; supports revocation.

#### Devotee

- **DevoteeProfile** is a 1:1 extension of User. It holds the spiritual identity (initiated name, spiritual master, initiation date, etc.) and the common demographic data.
- **StudentProfile**, **ProfessionalProfile**, **AlumniProfile** are optional 1:1 extensions of DevoteeProfile for type-specific data. A devotee can theoretically hold more than one (e.g., a working alumni), but the primary `profile_type` enum on DevoteeProfile drives navigation.
- **Skill** is a catalogue table (e.g., "Python", "Accounting", "Video Editing"). **DevoteeSkill** is the M:N junction that tags a devotee with skills and a proficiency level.
- **MentorAssignment** is a self-referencing relationship on DevoteeProfile: one mentor (counsellor) to many mentees. Assignments are dated and can be deactivated without deletion.
- **DevoteeRelationship** records informal social links between devotees: family, friend, or referrer.

#### Sadhana

- **SadhanaTemplate** defines what fields to track (rounds, mangal arati, etc.) — can be global or per-centre.
- **SadhanaTemplateItem** defines individual line items within a template (name, weight, max score).
- **SadhanaRecord** is the daily submission by a devotee, linked to a template.
- **SadhanaScore** is a pre-aggregated weekly/monthly summary, populated by a scheduled job (or DB trigger). Replaces expensive GROUP BY on SadhanaRecord for dashboards.

#### Events & Attendance

- **Event** belongs to a Centre and has a type (RETREAT, SEMINAR, FESTIVAL, CAMP, WEEKLY_PROGRAM).
- **Session** is a child of Event (a retreat has multiple sessions). Sessions have a physical/online location and a capacity.
- **EventRegistration** links a DevoteeProfile to an Event. It tracks payment and status (CONFIRMED, WAITLISTED, CANCELLED).
- **AttendanceRecord** links a DevoteeProfile to a Session (not directly to Event). It records check-in method (QR_SCAN, MANUAL), times, and who marked it.

#### Career

- **JobPost** is posted by a User (professional devotee or admin) and is optionally flagged as "devotee-friendly".
- **JobApplication** links a DevoteeProfile to a JobPost, with status and optional referral.
- **Referral** is a named record capturing who referred whom for a job (referrer DevoteeProfile → applicant DevoteeProfile → JobPost).

#### Seva

- **SevaOpportunity** can be standalone or linked to an Event.
- **SevaEnrollment** links a DevoteeProfile to a SevaOpportunity, tracking hours and completion status.

#### Communication

- **CommunicationGroup** can be BATCH (counsellor + mentees), CENTRE (all members), or OPEN (any devotees).
- **GroupMember** is the M:N junction between CommunicationGroup and User, with a role (ADMIN/MEMBER).
- **GroupMessage** is a message in a group, with support for pinning.

#### Notification

- **Notification** is a single delivered message to a User — in-app, email, or SMS. It references the source entity via `reference_type` + `reference_id` (polymorphic).
- **NotificationPreference** stores per-user, per-channel opt-in/out settings.

#### Preaching

- **PreachingContact** is a non-devotee person in the outreach pipeline, added by a devotee and optionally assigned to a counsellor.
- **ContactFollowup** is a dated interaction log against a PreachingContact.

#### Audit

- **AuditLog** captures every significant data mutation: table name, record ID, operation (INSERT/UPDATE/DELETE), old/new values (JSONB), the user who did it, and their IP address.

---

## Part 2 — Design Decisions

### A. Primary Keys — UUID v4

```sql
-- All PKs use UUID generated by PostgreSQL
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
```

**Rationale**: No sequential ID leakage, safe to expose in URLs, supports distributed ID generation if we later split services, globally unique across tables (useful for polymorphic audit references).

### B. Audit Fields — Every Table

```sql
created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
created_by  UUID REFERENCES users(id),
updated_by  UUID REFERENCES users(id)
```

A single `set_updated_at()` trigger function handles `updated_at` automatically.

### C. Soft Deletion Strategy

```sql
deleted_at  TIMESTAMPTZ,       -- NULL = active; timestamp = deleted
deleted_by  UUID REFERENCES users(id)
```

- All application queries include `WHERE deleted_at IS NULL`.
- A partial unique index on active rows: `WHERE deleted_at IS NULL` (prevents re-creation of unique email on an active user).
- Physical deletion is never done from the application layer. A scheduled DB job can hard-delete rows older than a retention window (e.g. 7 years for GDPR).

### D. Multi-Tenancy (Centre) Strategy

Every tenant-scoped table carries:

```sql
centre_id  UUID NOT NULL REFERENCES centres(id)
```

**Enforcement at three levels**:
1. **Application layer**: JWT `centreId` claim checked in `@PreAuthorize`.
2. **Query layer**: Spring Data repository methods include `findByCentreId(...)`.
3. **Database layer**: PostgreSQL Row-Level Security (RLS) as a backstop.

```sql
-- RLS example on devotee_profiles
ALTER TABLE devotee_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY centre_isolation ON devotee_profiles
  USING (centre_id = current_setting('app.current_centre_id')::UUID);
```

`SUPER_ADMIN` sessions set `app.current_centre_id = NULL` and bypass RLS.

### E. Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Tables | snake_case, plural | `devotee_profiles` |
| Columns | snake_case | `created_at` |
| PKs | `id` | `id UUID` |
| FKs | `{table_singular}_id` | `centre_id`, `devotee_id` |
| Indexes | `idx_{table}_{col(s)}` | `idx_users_email` |
| Unique | `uq_{table}_{col(s)}` | `uq_users_email` |
| Checks | `chk_{table}_{rule}` | `chk_sessions_times` |
| Enums | UPPER_SNAKE | `CONFIRMED`, `WAITLISTED` |

### F. Flyway Migration File Naming

```
V{major}.{minor}__{description}.sql

V1.0__create_extensions_and_functions.sql
V1.1__create_centres_table.sql
V1.2__create_identity_tables.sql
V2.0__create_devotee_tables.sql
V3.0__create_sadhana_tables.sql
V4.0__create_event_tables.sql
V5.0__create_career_tables.sql
V6.0__create_seva_tables.sql
V7.0__create_communication_tables.sql
V8.0__create_notification_tables.sql
V9.0__create_preaching_tables.sql
V10.0__create_audit_tables.sql
V10.1__create_rls_policies.sql
V10.2__seed_permissions.sql
V10.3__seed_default_roles.sql
```

---

## Part 3 — Full SQL DDL

---

### Migration V1.0 — Extensions & Shared Functions

```sql
-- V1.0__create_extensions_and_functions.sql

-- Required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pg_trgm";    -- trigram indexes for ILIKE search
CREATE EXTENSION IF NOT EXISTS "btree_gin";  -- GIN index on composite types

-- ────────────────────────────────────────────────
-- Shared trigger: auto-update updated_at column
-- ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- ────────────────────────────────────────────────
-- Helper: attach the updated_at trigger to any table
-- Usage: SELECT attach_updated_at_trigger('table_name');
-- ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION attach_updated_at_trigger(p_table TEXT)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
    EXECUTE format(
        'CREATE TRIGGER trg_%I_updated_at
         BEFORE UPDATE ON %I
         FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at()',
        p_table, p_table
    );
END;
$$;
```

---

### Migration V1.1 — Centres (Tenant Root)

```sql
-- V1.1__create_centres_table.sql

CREATE TABLE centres (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(150)    NOT NULL,
    short_code      VARCHAR(10)     NOT NULL,   -- e.g. 'MUM', 'BNG', 'DEL'
    city            VARCHAR(100)    NOT NULL,
    state           VARCHAR(100),
    country         VARCHAR(100)    NOT NULL DEFAULT 'India',
    timezone        VARCHAR(60)     NOT NULL DEFAULT 'Asia/Kolkata',
    address         TEXT,
    contact_email   VARCHAR(255),
    contact_phone   VARCHAR(20),
    logo_url        VARCHAR(500),
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,

    -- Audit fields
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    created_by      UUID,           -- No FK yet; users table doesn't exist
    updated_by      UUID,

    -- Soft delete
    deleted_at      TIMESTAMPTZ,
    deleted_by      UUID
);

CREATE UNIQUE INDEX uq_centres_short_code
    ON centres(short_code)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_centres_is_active
    ON centres(is_active)
    WHERE deleted_at IS NULL;

SELECT attach_updated_at_trigger('centres');

COMMENT ON TABLE centres IS
    'Top-level tenant entity. Every piece of user data belongs to a centre.';
COMMENT ON COLUMN centres.short_code IS
    'Short identifier used in display and reports, e.g. MUM for Mumbai.';
```

---

### Migration V1.2 — Identity: Users, Roles, Permissions

```sql
-- V1.2__create_identity_tables.sql

-- ────────────────────────────────────────────────
-- ENUM TYPES
-- ────────────────────────────────────────────────
CREATE TYPE user_status AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION');
CREATE TYPE gender_type  AS ENUM ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY');

-- ────────────────────────────────────────────────
-- USERS
-- ────────────────────────────────────────────────
CREATE TABLE users (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    centre_id           UUID            NOT NULL REFERENCES centres(id),
    email               VARCHAR(255)    NOT NULL,
    password_hash       VARCHAR(255)    NOT NULL,
    phone               VARCHAR(20),
    phone_encrypted     BYTEA,          -- AES-256 encrypted copy for display
    status              user_status     NOT NULL DEFAULT 'PENDING_VERIFICATION',
    email_verified_at   TIMESTAMPTZ,
    last_login_at       TIMESTAMPTZ,
    failed_login_count  SMALLINT        NOT NULL DEFAULT 0,
    locked_until        TIMESTAMPTZ,    -- Temporary lockout after failed attempts

    -- Audit fields
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    created_by          UUID            REFERENCES users(id),
    updated_by          UUID            REFERENCES users(id),

    -- Soft delete
    deleted_at          TIMESTAMPTZ,
    deleted_by          UUID            REFERENCES users(id)
);

-- Active email must be unique (soft-delete aware)
CREATE UNIQUE INDEX uq_users_email
    ON users(email)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_users_centre_id     ON users(centre_id);
CREATE INDEX idx_users_status        ON users(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_email_lookup  ON users(email);   -- for login lookups

SELECT attach_updated_at_trigger('users');

-- Now back-fill FK on centres (centres.created_by → users.id)
ALTER TABLE centres ADD CONSTRAINT fk_centres_created_by
    FOREIGN KEY (created_by) REFERENCES users(id);
ALTER TABLE centres ADD CONSTRAINT fk_centres_updated_by
    FOREIGN KEY (updated_by) REFERENCES users(id);
ALTER TABLE centres ADD CONSTRAINT fk_centres_deleted_by
    FOREIGN KEY (deleted_by) REFERENCES users(id);


-- ────────────────────────────────────────────────
-- REFRESH TOKENS
-- ────────────────────────────────────────────────
CREATE TABLE refresh_tokens (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID            NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash      VARCHAR(255)    NOT NULL,    -- SHA-256 of the actual token
    device_info     VARCHAR(255),               -- User-Agent snippet
    ip_address      INET,
    issued_at       TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    expires_at      TIMESTAMPTZ     NOT NULL,
    revoked_at      TIMESTAMPTZ,
    revoked_reason  VARCHAR(100)    -- LOGOUT, ROTATION, ADMIN_REVOKE

    -- No soft-delete; physical delete after expiry is acceptable here
);

CREATE UNIQUE INDEX uq_refresh_tokens_hash ON refresh_tokens(token_hash);
CREATE INDEX idx_refresh_tokens_user_id    ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

COMMENT ON TABLE refresh_tokens IS
    'Stores hashed refresh JWTs for rotation and revocation. Expired rows cleaned by scheduler.';


-- ────────────────────────────────────────────────
-- ROLES
-- ────────────────────────────────────────────────
CREATE TABLE roles (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(60)     NOT NULL,
    description     VARCHAR(255),
    centre_id       UUID            REFERENCES centres(id),   -- NULL = system-wide role
    is_system_role  BOOLEAN         NOT NULL DEFAULT FALSE,   -- Cannot be deleted

    -- Audit
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    created_by      UUID            REFERENCES users(id),
    updated_by      UUID            REFERENCES users(id),

    -- Soft delete
    deleted_at      TIMESTAMPTZ,
    deleted_by      UUID            REFERENCES users(id)
);

-- Role name unique per scope (system roles: centre_id NULL; centre roles: per centre)
CREATE UNIQUE INDEX uq_roles_name_centre
    ON roles(name, COALESCE(centre_id, '00000000-0000-0000-0000-000000000000'::UUID))
    WHERE deleted_at IS NULL;

CREATE INDEX idx_roles_centre_id ON roles(centre_id);

SELECT attach_updated_at_trigger('roles');


-- ────────────────────────────────────────────────
-- PERMISSIONS  (static catalogue — seeded by Flyway)
-- ────────────────────────────────────────────────
CREATE TABLE permissions (
    id          UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    module      VARCHAR(60)     NOT NULL,   -- e.g. 'devotee', 'event', 'career'
    action      VARCHAR(60)     NOT NULL,   -- e.g. 'read', 'write', 'delete', 'export'
    scope       VARCHAR(60),               -- e.g. 'own', 'centre', 'all'
    description VARCHAR(255),

    created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
    -- No soft-delete; permissions are immutable catalogue entries
);

CREATE UNIQUE INDEX uq_permissions_module_action_scope
    ON permissions(module, action, COALESCE(scope, ''));

COMMENT ON TABLE permissions IS
    'Immutable catalogue. Seeded by Flyway. Never modified at runtime.';


-- ────────────────────────────────────────────────
-- ROLE_PERMISSIONS  (join: roles ↔ permissions)
-- ────────────────────────────────────────────────
CREATE TABLE role_permissions (
    role_id         UUID    NOT NULL REFERENCES roles(id)       ON DELETE CASCADE,
    permission_id   UUID    NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by      UUID    REFERENCES users(id),

    PRIMARY KEY (role_id, permission_id)
);

CREATE INDEX idx_role_permissions_permission_id ON role_permissions(permission_id);


-- ────────────────────────────────────────────────
-- USER_ROLES  (join: users ↔ roles ↔ centre scope)
-- ────────────────────────────────────────────────
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

CREATE INDEX idx_user_roles_user_id   ON user_roles(user_id);
CREATE INDEX idx_user_roles_centre_id ON user_roles(centre_id);
CREATE INDEX idx_user_roles_role_id   ON user_roles(role_id);
```

---

### Migration V2.0 — Devotee Domain

```sql
-- V2.0__create_devotee_tables.sql

-- ────────────────────────────────────────────────
-- ENUM TYPES
-- ────────────────────────────────────────────────
CREATE TYPE profile_type        AS ENUM ('STUDENT', 'WORKING_PROFESSIONAL', 'ALUMNI', 'OTHER');
CREATE TYPE initiation_status   AS ENUM ('UNINITIATED', 'FIRST_INITIATED', 'SECOND_INITIATED');
CREATE TYPE relationship_type   AS ENUM ('FAMILY', 'FRIEND', 'REFERRER', 'SPOUSE', 'COLLEAGUE');
CREATE TYPE proficiency_level   AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT');
CREATE TYPE employment_type     AS ENUM ('FULL_TIME', 'PART_TIME', 'SELF_EMPLOYED', 'FREELANCER', 'NOT_WORKING');


-- ────────────────────────────────────────────────
-- DEVOTEE_PROFILES  (1:1 extension of users)
-- ────────────────────────────────────────────────
CREATE TABLE devotee_profiles (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID            NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    centre_id           UUID            NOT NULL REFERENCES centres(id),

    -- Spiritual identity
    initiated_name      VARCHAR(150),
    legal_name          VARCHAR(150)    NOT NULL,
    spiritual_master    VARCHAR(150),
    initiation_status   initiation_status NOT NULL DEFAULT 'UNINITIATED',
    initiated_date      DATE,
    
    -- Demographics
    dob                 DATE,
    gender              gender_type,
    profile_type        profile_type    NOT NULL DEFAULT 'OTHER',
    profile_photo_url   VARCHAR(500),

    -- Contact
    phone               VARCHAR(20),
    phone_encrypted     BYTEA,
    address             TEXT,
    city                VARCHAR(100),
    state               VARCHAR(100),
    pincode             VARCHAR(10),

    -- Programme info
    join_date           DATE            NOT NULL DEFAULT CURRENT_DATE,
    is_regular          BOOLEAN         NOT NULL DEFAULT FALSE,
    notes               TEXT,

    -- Audit fields
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    created_by          UUID            REFERENCES users(id),
    updated_by          UUID            REFERENCES users(id),

    -- Soft delete
    deleted_at          TIMESTAMPTZ,
    deleted_by          UUID            REFERENCES users(id),

    -- Constraints
    CONSTRAINT chk_devotee_initiated_date
        CHECK (initiated_date IS NULL OR dob IS NULL OR initiated_date >= dob),
    CONSTRAINT chk_devotee_initiated_fields
        CHECK (
            initiation_status = 'UNINITIATED'
            OR (initiation_status != 'UNINITIATED' AND initiated_name IS NOT NULL)
        )
);

CREATE INDEX idx_devotee_profiles_centre_id     ON devotee_profiles(centre_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_devotee_profiles_user_id       ON devotee_profiles(user_id);
CREATE INDEX idx_devotee_profiles_profile_type  ON devotee_profiles(centre_id, profile_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_devotee_profiles_join_date     ON devotee_profiles(centre_id, join_date) WHERE deleted_at IS NULL;

-- Trigram index for name search
CREATE INDEX idx_devotee_profiles_legal_name_trgm
    ON devotee_profiles USING GIN (legal_name gin_trgm_ops)
    WHERE deleted_at IS NULL;
CREATE INDEX idx_devotee_profiles_initiated_name_trgm
    ON devotee_profiles USING GIN (initiated_name gin_trgm_ops)
    WHERE deleted_at IS NULL AND initiated_name IS NOT NULL;

SELECT attach_updated_at_trigger('devotee_profiles');

COMMENT ON TABLE devotee_profiles IS
    'Core devotee identity record. 1:1 with users. Extended by sub-type tables.';


-- ────────────────────────────────────────────────
-- STUDENT_PROFILES  (1:1 extension of devotee_profiles)
-- ────────────────────────────────────────────────
CREATE TABLE student_profiles (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    devotee_id          UUID        NOT NULL UNIQUE REFERENCES devotee_profiles(id) ON DELETE CASCADE,
    institution         VARCHAR(200),
    course              VARCHAR(150),
    specialisation      VARCHAR(150),
    year_of_study       SMALLINT,
    expected_graduation DATE,
    student_id_number   VARCHAR(50),
    hostel_resident     BOOLEAN     NOT NULL DEFAULT FALSE,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_student_year CHECK (year_of_study IS NULL OR year_of_study BETWEEN 1 AND 10)
);

SELECT attach_updated_at_trigger('student_profiles');


-- ────────────────────────────────────────────────
-- PROFESSIONAL_PROFILES
-- ────────────────────────────────────────────────
CREATE TABLE professional_profiles (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    devotee_id          UUID            NOT NULL UNIQUE REFERENCES devotee_profiles(id) ON DELETE CASCADE,
    company             VARCHAR(200),
    designation         VARCHAR(150),
    industry            VARCHAR(100),
    employment_type     employment_type NOT NULL DEFAULT 'FULL_TIME',
    experience_years    SMALLINT,
    annual_income_range VARCHAR(50),    -- e.g. '5-10 LPA' — stored as label, not PII amount
    linkedin_url        VARCHAR(500),
    is_mentor_willing   BOOLEAN         NOT NULL DEFAULT FALSE,

    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_professional_experience CHECK (experience_years IS NULL OR experience_years >= 0)
);

SELECT attach_updated_at_trigger('professional_profiles');


-- ────────────────────────────────────────────────
-- ALUMNI_PROFILES
-- ────────────────────────────────────────────────
CREATE TABLE alumni_profiles (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    devotee_id          UUID        NOT NULL UNIQUE REFERENCES devotee_profiles(id) ON DELETE CASCADE,
    graduation_year     SMALLINT,
    institution         VARCHAR(200),
    degree              VARCHAR(150),
    current_profession  VARCHAR(150),
    current_company     VARCHAR(200),
    city_of_residence   VARCHAR(100),
    is_active_devotee   BOOLEAN     NOT NULL DEFAULT TRUE,
    wants_to_connect    BOOLEAN     NOT NULL DEFAULT FALSE,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_alumni_graduation_year
        CHECK (graduation_year IS NULL OR graduation_year BETWEEN 1900 AND 2100)
);

SELECT attach_updated_at_trigger('alumni_profiles');


-- ────────────────────────────────────────────────
-- SKILLS  (catalogue)
-- ────────────────────────────────────────────────
CREATE TABLE skills (
    id          UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100)    NOT NULL,
    category    VARCHAR(100),   -- e.g. 'Technology', 'Arts', 'Management'
    is_active   BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX uq_skills_name ON skills(LOWER(name));
CREATE INDEX idx_skills_category   ON skills(category) WHERE is_active = TRUE;


-- ────────────────────────────────────────────────
-- DEVOTEE_SKILLS  (M:N — devotee ↔ skill)
-- ────────────────────────────────────────────────
CREATE TABLE devotee_skills (
    devotee_id          UUID                NOT NULL REFERENCES devotee_profiles(id) ON DELETE CASCADE,
    skill_id            UUID                NOT NULL REFERENCES skills(id),
    proficiency_level   proficiency_level   NOT NULL DEFAULT 'BEGINNER',
    years_experience    SMALLINT,
    is_seva_willing     BOOLEAN             NOT NULL DEFAULT FALSE,
    added_at            TIMESTAMPTZ         NOT NULL DEFAULT NOW(),

    PRIMARY KEY (devotee_id, skill_id)
);

CREATE INDEX idx_devotee_skills_skill_id ON devotee_skills(skill_id);


-- ────────────────────────────────────────────────
-- MENTOR_ASSIGNMENTS
-- ────────────────────────────────────────────────
CREATE TABLE mentor_assignments (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    centre_id       UUID        NOT NULL REFERENCES centres(id),
    mentor_id       UUID        NOT NULL REFERENCES devotee_profiles(id),
    mentee_id       UUID        NOT NULL REFERENCES devotee_profiles(id),
    assigned_at     DATE        NOT NULL DEFAULT CURRENT_DATE,
    assigned_by     UUID        REFERENCES users(id),
    ended_at        DATE,
    end_reason      VARCHAR(255),
    notes           TEXT,

    -- Audit
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by      UUID        REFERENCES users(id),
    updated_by      UUID        REFERENCES users(id),

    CONSTRAINT chk_mentor_not_self CHECK (mentor_id != mentee_id),
    CONSTRAINT chk_mentor_dates    CHECK (ended_at IS NULL OR ended_at >= assigned_at)
);

-- A mentee can only have one ACTIVE mentor at a time per centre
CREATE UNIQUE INDEX uq_mentor_assignments_active_mentee
    ON mentor_assignments(centre_id, mentee_id)
    WHERE ended_at IS NULL;

CREATE INDEX idx_mentor_assignments_mentor_id ON mentor_assignments(mentor_id) WHERE ended_at IS NULL;
CREATE INDEX idx_mentor_assignments_mentee_id ON mentor_assignments(mentee_id);
CREATE INDEX idx_mentor_assignments_centre_id ON mentor_assignments(centre_id);

SELECT attach_updated_at_trigger('mentor_assignments');


-- ────────────────────────────────────────────────
-- DEVOTEE_RELATIONSHIPS
-- ────────────────────────────────────────────────
CREATE TABLE devotee_relationships (
    id                  UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
    devotee_id          UUID                NOT NULL REFERENCES devotee_profiles(id),
    related_devotee_id  UUID                NOT NULL REFERENCES devotee_profiles(id),
    relationship_type   relationship_type   NOT NULL,
    notes               VARCHAR(255),
    created_at          TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    created_by          UUID                REFERENCES users(id),

    CONSTRAINT chk_devotee_rel_not_self CHECK (devotee_id != related_devotee_id)
);

CREATE UNIQUE INDEX uq_devotee_relationships
    ON devotee_relationships(devotee_id, related_devotee_id, relationship_type);

CREATE INDEX idx_devotee_relationships_related ON devotee_relationships(related_devotee_id);
```

---

### Migration V3.0 — Sadhana Domain

```sql
-- V3.0__create_sadhana_tables.sql

-- ────────────────────────────────────────────────
-- SADHANA_TEMPLATES
-- ────────────────────────────────────────────────
CREATE TABLE sadhana_templates (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    centre_id       UUID        REFERENCES centres(id),   -- NULL = global template
    name            VARCHAR(100) NOT NULL,
    description     TEXT,
    is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
    is_default      BOOLEAN     NOT NULL DEFAULT FALSE,

    -- Audit
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by      UUID        REFERENCES users(id),
    updated_by      UUID        REFERENCES users(id),

    -- Soft delete
    deleted_at      TIMESTAMPTZ,
    deleted_by      UUID        REFERENCES users(id)
);

-- Only one default template per scope (global or per centre)
CREATE UNIQUE INDEX uq_sadhana_template_default
    ON sadhana_templates(COALESCE(centre_id, '00000000-0000-0000-0000-000000000000'::UUID))
    WHERE is_default = TRUE AND deleted_at IS NULL;

SELECT attach_updated_at_trigger('sadhana_templates');


-- ────────────────────────────────────────────────
-- SADHANA_TEMPLATE_ITEMS
-- ────────────────────────────────────────────────
CREATE TABLE sadhana_template_items (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id     UUID        NOT NULL REFERENCES sadhana_templates(id) ON DELETE CASCADE,
    item_key        VARCHAR(60) NOT NULL,    -- e.g. 'rounds_chanted', 'mangal_arati'
    label           VARCHAR(100) NOT NULL,
    item_type       VARCHAR(20) NOT NULL,    -- 'BOOLEAN', 'INTEGER', 'MINUTES'
    max_score       SMALLINT    NOT NULL DEFAULT 1,
    weight          NUMERIC(5,2) NOT NULL DEFAULT 1.0,
    sort_order      SMALLINT    NOT NULL DEFAULT 0,
    is_required     BOOLEAN     NOT NULL DEFAULT FALSE,

    PRIMARY KEY (id),
    CONSTRAINT chk_sadhana_item_type
        CHECK (item_type IN ('BOOLEAN', 'INTEGER', 'MINUTES'))
);

CREATE UNIQUE INDEX uq_sadhana_template_items_key
    ON sadhana_template_items(template_id, item_key);

CREATE INDEX idx_sadhana_template_items_template
    ON sadhana_template_items(template_id);


-- ────────────────────────────────────────────────
-- SADHANA_RECORDS  (daily submission)
-- ────────────────────────────────────────────────
CREATE TABLE sadhana_records (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    devotee_id          UUID            NOT NULL REFERENCES devotee_profiles(id),
    centre_id           UUID            NOT NULL REFERENCES centres(id),
    template_id         UUID            NOT NULL REFERENCES sadhana_templates(id),
    record_date         DATE            NOT NULL,

    -- Core sadhana fields (denormalised for query performance)
    rounds_chanted      SMALLINT        NOT NULL DEFAULT 0,
    mangal_arati        BOOLEAN         NOT NULL DEFAULT FALSE,
    japa_before_8am     BOOLEAN         NOT NULL DEFAULT FALSE,
    evening_arati       BOOLEAN         NOT NULL DEFAULT FALSE,
    class_attendance    BOOLEAN         NOT NULL DEFAULT FALSE,
    reading_minutes     SMALLINT        NOT NULL DEFAULT 0,
    seva_done           BOOLEAN         NOT NULL DEFAULT FALSE,

    -- Flexible additional values (JSON for template-specific items)
    extra_data          JSONB,

    -- Computed score (application layer calculates and stores)
    score               NUMERIC(6,2)    NOT NULL DEFAULT 0,
    max_possible_score  NUMERIC(6,2)    NOT NULL DEFAULT 0,

    notes               TEXT,
    submitted_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    submitted_by        UUID            REFERENCES users(id),  -- Self or counsellor

    -- Audit
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_by          UUID            REFERENCES users(id),

    CONSTRAINT chk_sadhana_rounds   CHECK (rounds_chanted >= 0),
    CONSTRAINT chk_sadhana_reading  CHECK (reading_minutes >= 0),
    CONSTRAINT chk_sadhana_score    CHECK (score >= 0 AND score <= max_possible_score)
);

-- A devotee submits at most one record per day
CREATE UNIQUE INDEX uq_sadhana_records_devotee_date
    ON sadhana_records(devotee_id, record_date);

CREATE INDEX idx_sadhana_records_centre_date
    ON sadhana_records(centre_id, record_date DESC);

CREATE INDEX idx_sadhana_records_devotee_date_range
    ON sadhana_records(devotee_id, record_date DESC);

CREATE INDEX idx_sadhana_records_extra_data
    ON sadhana_records USING GIN (extra_data);

SELECT attach_updated_at_trigger('sadhana_records');

COMMENT ON COLUMN sadhana_records.extra_data IS
    'JSONB store for template-specific items beyond the standard columns.';


-- ────────────────────────────────────────────────
-- SADHANA_SCORES  (pre-aggregated for dashboards)
-- ────────────────────────────────────────────────
CREATE TABLE sadhana_scores (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    devotee_id      UUID            NOT NULL REFERENCES devotee_profiles(id),
    centre_id       UUID            NOT NULL REFERENCES centres(id),
    period_type     VARCHAR(10)     NOT NULL,   -- 'WEEKLY' | 'MONTHLY'
    period_year     SMALLINT        NOT NULL,
    period_number   SMALLINT        NOT NULL,   -- week-of-year (1-53) or month (1-12)

    total_days          SMALLINT    NOT NULL DEFAULT 0,
    days_submitted      SMALLINT    NOT NULL DEFAULT 0,
    total_rounds        SMALLINT    NOT NULL DEFAULT 0,
    avg_rounds          NUMERIC(5,2) NOT NULL DEFAULT 0,
    avg_score           NUMERIC(6,2) NOT NULL DEFAULT 0,
    attendance_count    SMALLINT    NOT NULL DEFAULT 0,  -- class_attendance = TRUE count
    mangal_arati_count  SMALLINT    NOT NULL DEFAULT 0,

    computed_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_sadhana_score_period_type CHECK (period_type IN ('WEEKLY', 'MONTHLY')),
    CONSTRAINT chk_sadhana_score_month       CHECK (period_type = 'WEEKLY' OR period_number BETWEEN 1 AND 12),
    CONSTRAINT chk_sadhana_score_week        CHECK (period_type = 'MONTHLY' OR period_number BETWEEN 1 AND 53)
);

CREATE UNIQUE INDEX uq_sadhana_scores_period
    ON sadhana_scores(devotee_id, period_type, period_year, period_number);

CREATE INDEX idx_sadhana_scores_centre_period
    ON sadhana_scores(centre_id, period_type, period_year, period_number);
```

---

### Migration V4.0 — Events, Sessions & Attendance

```sql
-- V4.0__create_event_tables.sql

-- ────────────────────────────────────────────────
-- ENUM TYPES
-- ────────────────────────────────────────────────
CREATE TYPE event_type              AS ENUM ('RETREAT', 'SEMINAR', 'FESTIVAL', 'CAMP', 'WEEKLY_PROGRAM', 'WORKSHOP', 'OUTREACH', 'OTHER');
CREATE TYPE event_status            AS ENUM ('DRAFT', 'PUBLISHED', 'ONGOING', 'COMPLETED', 'CANCELLED');
CREATE TYPE registration_status     AS ENUM ('CONFIRMED', 'WAITLISTED', 'CANCELLED', 'ATTENDED', 'NO_SHOW');
CREATE TYPE payment_status          AS ENUM ('FREE', 'PENDING', 'PAID', 'WAIVED', 'REFUNDED');
CREATE TYPE attendance_method       AS ENUM ('QR_SCAN', 'MANUAL', 'SELF_MARK');
CREATE TYPE session_type            AS ENUM ('LECTURE', 'KIRTAN', 'WORKSHOP', 'DISCUSSION', 'PRASADAM', 'OTHER');


-- ────────────────────────────────────────────────
-- EVENTS
-- ────────────────────────────────────────────────
CREATE TABLE events (
    id                      UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    centre_id               UUID            NOT NULL REFERENCES centres(id),
    title                   VARCHAR(200)    NOT NULL,
    description             TEXT,
    event_type              event_type      NOT NULL,
    status                  event_status    NOT NULL DEFAULT 'DRAFT',
    start_date              DATE            NOT NULL,
    end_date                DATE            NOT NULL,
    start_time              TIME,
    end_time                TIME,
    location_name           VARCHAR(200),
    location_address        TEXT,
    is_online               BOOLEAN         NOT NULL DEFAULT FALSE,
    online_link             VARCHAR(500),
    capacity                INTEGER,
    waitlist_limit          INTEGER,
    registration_open       BOOLEAN         NOT NULL DEFAULT TRUE,
    registration_deadline   TIMESTAMPTZ,
    is_paid                 BOOLEAN         NOT NULL DEFAULT FALSE,
    fee_amount              NUMERIC(10,2),
    fee_currency            CHAR(3)         DEFAULT 'INR',
    banner_image_url        VARCHAR(500),
    created_by              UUID            NOT NULL REFERENCES users(id),

    -- Audit
    created_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_by              UUID            REFERENCES users(id),

    -- Soft delete
    deleted_at              TIMESTAMPTZ,
    deleted_by              UUID            REFERENCES users(id),

    CONSTRAINT chk_events_dates   CHECK (end_date >= start_date),
    CONSTRAINT chk_events_times   CHECK (start_time IS NULL OR end_time IS NULL OR end_time > start_time),
    CONSTRAINT chk_events_fee     CHECK (is_paid = FALSE OR fee_amount > 0),
    CONSTRAINT chk_events_capacity CHECK (capacity IS NULL OR capacity > 0)
);

CREATE INDEX idx_events_centre_status   ON events(centre_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_events_start_date      ON events(centre_id, start_date DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_events_event_type      ON events(centre_id, event_type) WHERE deleted_at IS NULL;

SELECT attach_updated_at_trigger('events');


-- ────────────────────────────────────────────────
-- SESSIONS  (child of events)
-- ────────────────────────────────────────────────
CREATE TABLE sessions (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id        UUID            NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    title           VARCHAR(200)    NOT NULL,
    session_type    session_type    NOT NULL DEFAULT 'LECTURE',
    facilitator     VARCHAR(150),
    facilitator_devotee_id UUID     REFERENCES devotee_profiles(id),
    start_time      TIMESTAMPTZ     NOT NULL,
    end_time        TIMESTAMPTZ     NOT NULL,
    location        VARCHAR(200),
    capacity        INTEGER,
    notes           TEXT,
    sort_order      SMALLINT        NOT NULL DEFAULT 0,

    -- Audit
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    created_by      UUID            REFERENCES users(id),
    updated_by      UUID            REFERENCES users(id),

    -- Soft delete
    deleted_at      TIMESTAMPTZ,
    deleted_by      UUID            REFERENCES users(id),

    CONSTRAINT chk_sessions_times CHECK (end_time > start_time)
);

CREATE INDEX idx_sessions_event_id  ON sessions(event_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_sessions_start     ON sessions(event_id, start_time) WHERE deleted_at IS NULL;

SELECT attach_updated_at_trigger('sessions');


-- ────────────────────────────────────────────────
-- EVENT_REGISTRATIONS
-- ────────────────────────────────────────────────
CREATE TABLE event_registrations (
    id                  UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id            UUID                NOT NULL REFERENCES events(id),
    devotee_id          UUID                NOT NULL REFERENCES devotee_profiles(id),
    centre_id           UUID                NOT NULL REFERENCES centres(id),
    status              registration_status NOT NULL DEFAULT 'CONFIRMED',
    payment_status      payment_status      NOT NULL DEFAULT 'FREE',
    payment_reference   VARCHAR(100),
    registered_at       TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    registered_by       UUID                REFERENCES users(id),
    cancelled_at        TIMESTAMPTZ,
    cancelled_by        UUID                REFERENCES users(id),
    cancellation_reason VARCHAR(255),
    notes               TEXT,

    -- Audit
    created_at          TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    updated_by          UUID                REFERENCES users(id)
);

-- A devotee registers for an event once
CREATE UNIQUE INDEX uq_event_registrations
    ON event_registrations(event_id, devotee_id)
    WHERE cancelled_at IS NULL;

CREATE INDEX idx_event_registrations_event     ON event_registrations(event_id, status);
CREATE INDEX idx_event_registrations_devotee   ON event_registrations(devotee_id);
CREATE INDEX idx_event_registrations_centre    ON event_registrations(centre_id, registered_at DESC);

SELECT attach_updated_at_trigger('event_registrations');


-- ────────────────────────────────────────────────
-- ATTENDANCE_RECORDS
-- ────────────────────────────────────────────────
CREATE TABLE attendance_records (
    id                  UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id          UUID                NOT NULL REFERENCES sessions(id),
    devotee_id          UUID                NOT NULL REFERENCES devotee_profiles(id),
    centre_id           UUID                NOT NULL REFERENCES centres(id),
    attendance_method   attendance_method   NOT NULL DEFAULT 'MANUAL',
    check_in_time       TIMESTAMPTZ,
    check_out_time      TIMESTAMPTZ,
    marked_by           UUID                REFERENCES users(id),
    qr_scan_data        VARCHAR(500),       -- Raw QR payload for audit
    notes               VARCHAR(255),

    -- Audit
    created_at          TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    updated_by          UUID                REFERENCES users(id),

    CONSTRAINT chk_attendance_times
        CHECK (check_out_time IS NULL OR check_in_time IS NULL OR check_out_time >= check_in_time)
);

-- A devotee can only have one attendance record per session
CREATE UNIQUE INDEX uq_attendance_records
    ON attendance_records(session_id, devotee_id);

CREATE INDEX idx_attendance_records_session    ON attendance_records(session_id);
CREATE INDEX idx_attendance_records_devotee    ON attendance_records(devotee_id);
CREATE INDEX idx_attendance_records_centre     ON attendance_records(centre_id, check_in_time DESC);

SELECT attach_updated_at_trigger('attendance_records');
```

---

### Migration V5.0 — Career Domain

```sql
-- V5.0__create_career_tables.sql

-- ────────────────────────────────────────────────
-- ENUM TYPES
-- ────────────────────────────────────────────────
CREATE TYPE job_type            AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'REMOTE', 'HYBRID');
CREATE TYPE job_status          AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'CLOSED', 'FILLED');
CREATE TYPE application_status  AS ENUM ('APPLIED', 'SHORTLISTED', 'INTERVIEWING', 'OFFERED', 'HIRED', 'REJECTED', 'WITHDRAWN');
CREATE TYPE referral_status     AS ENUM ('PENDING', 'CONTACTED', 'APPLIED', 'HIRED', 'NOT_INTERESTED');


-- ────────────────────────────────────────────────
-- JOB_POSTS
-- ────────────────────────────────────────────────
CREATE TABLE job_posts (
    id                      UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    centre_id               UUID            NOT NULL REFERENCES centres(id),
    posted_by               UUID            NOT NULL REFERENCES users(id),
    title                   VARCHAR(200)    NOT NULL,
    description             TEXT            NOT NULL,
    company                 VARCHAR(200)    NOT NULL,
    location                VARCHAR(200),
    job_type                job_type        NOT NULL DEFAULT 'FULL_TIME',
    status                  job_status      NOT NULL DEFAULT 'DRAFT',
    min_experience_years    SMALLINT,
    max_experience_years    SMALLINT,
    min_salary              NUMERIC(12,2),
    max_salary              NUMERIC(12,2),
    salary_currency         CHAR(3)         DEFAULT 'INR',
    salary_visible          BOOLEAN         NOT NULL DEFAULT FALSE,
    is_devotee_friendly     BOOLEAN         NOT NULL DEFAULT FALSE,  -- e.g. allows Ekadasi leave
    skills_required         TEXT[],         -- Denormalised tag array for quick filter
    external_apply_url      VARCHAR(500),
    expires_at              TIMESTAMPTZ,

    -- Audit
    created_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_by              UUID            REFERENCES users(id),

    -- Soft delete
    deleted_at              TIMESTAMPTZ,
    deleted_by              UUID            REFERENCES users(id),

    CONSTRAINT chk_job_experience CHECK (
        min_experience_years IS NULL OR max_experience_years IS NULL OR
        max_experience_years >= min_experience_years
    ),
    CONSTRAINT chk_job_salary CHECK (
        min_salary IS NULL OR max_salary IS NULL OR max_salary >= min_salary
    )
);

CREATE INDEX idx_job_posts_centre_status    ON job_posts(centre_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_job_posts_devotee_friendly ON job_posts(is_devotee_friendly) WHERE status = 'ACTIVE' AND deleted_at IS NULL;
CREATE INDEX idx_job_posts_expires_at       ON job_posts(expires_at) WHERE status = 'ACTIVE';
CREATE INDEX idx_job_posts_skills           ON job_posts USING GIN (skills_required);

SELECT attach_updated_at_trigger('job_posts');


-- ────────────────────────────────────────────────
-- JOB_APPLICATIONS
-- ────────────────────────────────────────────────
CREATE TABLE job_applications (
    id                  UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id              UUID                NOT NULL REFERENCES job_posts(id),
    devotee_id          UUID                NOT NULL REFERENCES devotee_profiles(id),
    status              application_status  NOT NULL DEFAULT 'APPLIED',
    cover_note          TEXT,
    resume_url          VARCHAR(500),
    referral_id         UUID,               -- FK to referrals (added after referrals table)
    applied_at          TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    status_updated_at   TIMESTAMPTZ,
    status_updated_by   UUID                REFERENCES users(id),
    notes               TEXT,               -- Recruiter notes

    -- Audit
    created_at          TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    updated_by          UUID                REFERENCES users(id)
);

-- A devotee applies to a job once
CREATE UNIQUE INDEX uq_job_applications ON job_applications(job_id, devotee_id);

CREATE INDEX idx_job_applications_job_id   ON job_applications(job_id, status);
CREATE INDEX idx_job_applications_devotee  ON job_applications(devotee_id);

SELECT attach_updated_at_trigger('job_applications');


-- ────────────────────────────────────────────────
-- REFERRALS
-- ────────────────────────────────────────────────
CREATE TABLE referrals (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id              UUID            NOT NULL REFERENCES job_posts(id),
    referrer_devotee_id UUID            NOT NULL REFERENCES devotee_profiles(id),
    referred_devotee_id UUID            REFERENCES devotee_profiles(id),  -- NULL if external
    referred_name       VARCHAR(150),   -- For non-devotee referrals
    referred_email      VARCHAR(255),
    referred_phone      VARCHAR(20),
    status              referral_status NOT NULL DEFAULT 'PENDING',
    notes               TEXT,
    referral_date       TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    outcome_date        TIMESTAMPTZ,
    outcome_notes       TEXT,

    -- Audit
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_by          UUID            REFERENCES users(id),

    CONSTRAINT chk_referral_not_self CHECK (referrer_devotee_id != referred_devotee_id),
    CONSTRAINT chk_referral_contact  CHECK (
        referred_devotee_id IS NOT NULL OR referred_email IS NOT NULL OR referred_phone IS NOT NULL
    )
);

CREATE INDEX idx_referrals_job_id     ON referrals(job_id);
CREATE INDEX idx_referrals_referrer   ON referrals(referrer_devotee_id);
CREATE INDEX idx_referrals_referred   ON referrals(referred_devotee_id);

SELECT attach_updated_at_trigger('referrals');

-- Now add the FK from job_applications to referrals
ALTER TABLE job_applications
    ADD CONSTRAINT fk_job_applications_referral
    FOREIGN KEY (referral_id) REFERENCES referrals(id);
```

---

### Migration V6.0 — Seva Domain

```sql
-- V6.0__create_seva_tables.sql

CREATE TYPE seva_status         AS ENUM ('OPEN', 'FILLED', 'ONGOING', 'COMPLETED', 'CANCELLED');
CREATE TYPE enrollment_status   AS ENUM ('ENROLLED', 'CONFIRMED', 'COMPLETED', 'WITHDRAWN', 'NO_SHOW');

-- ────────────────────────────────────────────────
-- SEVA_OPPORTUNITIES
-- ────────────────────────────────────────────────
CREATE TABLE seva_opportunities (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    centre_id           UUID            NOT NULL REFERENCES centres(id),
    event_id            UUID            REFERENCES events(id),  -- optional link to event
    title               VARCHAR(200)    NOT NULL,
    description         TEXT,
    seva_type           VARCHAR(100)    NOT NULL,  -- e.g. 'KITCHEN', 'DECORATION', 'TECH', 'TRANSPORT'
    skills_needed       TEXT[],
    start_date          DATE            NOT NULL,
    end_date            DATE,
    start_time          TIME,
    end_time            TIME,
    location            VARCHAR(200),
    max_volunteers      INTEGER,
    min_volunteers      INTEGER,
    status              seva_status     NOT NULL DEFAULT 'OPEN',
    contact_devotee_id  UUID            REFERENCES devotee_profiles(id),
    notes               TEXT,
    created_by          UUID            NOT NULL REFERENCES users(id),

    -- Audit
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_by          UUID            REFERENCES users(id),

    -- Soft delete
    deleted_at          TIMESTAMPTZ,
    deleted_by          UUID            REFERENCES users(id),

    CONSTRAINT chk_seva_dates    CHECK (end_date IS NULL OR end_date >= start_date),
    CONSTRAINT chk_seva_capacity CHECK (
        min_volunteers IS NULL OR max_volunteers IS NULL OR max_volunteers >= min_volunteers
    )
);

CREATE INDEX idx_seva_opportunities_centre    ON seva_opportunities(centre_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_seva_opportunities_event_id  ON seva_opportunities(event_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_seva_opportunities_skills    ON seva_opportunities USING GIN (skills_needed);

SELECT attach_updated_at_trigger('seva_opportunities');


-- ────────────────────────────────────────────────
-- SEVA_ENROLLMENTS
-- ────────────────────────────────────────────────
CREATE TABLE seva_enrollments (
    id                  UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
    seva_id             UUID                NOT NULL REFERENCES seva_opportunities(id),
    devotee_id          UUID                NOT NULL REFERENCES devotee_profiles(id),
    centre_id           UUID                NOT NULL REFERENCES centres(id),
    status              enrollment_status   NOT NULL DEFAULT 'ENROLLED',
    enrolled_at         TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    enrolled_by         UUID                REFERENCES users(id),
    completed_at        TIMESTAMPTZ,
    hours_completed     NUMERIC(5,2),
    devotee_feedback    TEXT,
    coordinator_notes   TEXT,
    rating              SMALLINT,           -- 1-5 rating by coordinator

    -- Audit
    created_at          TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    updated_by          UUID                REFERENCES users(id),

    CONSTRAINT chk_seva_enrollment_hours  CHECK (hours_completed IS NULL OR hours_completed >= 0),
    CONSTRAINT chk_seva_enrollment_rating CHECK (rating IS NULL OR rating BETWEEN 1 AND 5)
);

CREATE UNIQUE INDEX uq_seva_enrollments ON seva_enrollments(seva_id, devotee_id);
CREATE INDEX idx_seva_enrollments_devotee ON seva_enrollments(devotee_id);
CREATE INDEX idx_seva_enrollments_centre  ON seva_enrollments(centre_id, enrolled_at DESC);

SELECT attach_updated_at_trigger('seva_enrollments');
```

---

### Migration V7.0 — Communication Domain

```sql
-- V7.0__create_communication_tables.sql

CREATE TYPE group_type      AS ENUM ('BATCH', 'CENTRE', 'OPEN', 'ANNOUNCEMENT');
CREATE TYPE member_role     AS ENUM ('ADMIN', 'MEMBER', 'MODERATOR');
CREATE TYPE message_type    AS ENUM ('TEXT', 'IMAGE', 'DOCUMENT', 'LINK', 'ANNOUNCEMENT');

-- ────────────────────────────────────────────────
-- COMMUNICATION_GROUPS
-- ────────────────────────────────────────────────
CREATE TABLE communication_groups (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    centre_id       UUID        NOT NULL REFERENCES centres(id),
    name            VARCHAR(150) NOT NULL,
    description     VARCHAR(500),
    group_type      group_type  NOT NULL DEFAULT 'OPEN',
    avatar_url      VARCHAR(500),
    is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
    created_by      UUID        NOT NULL REFERENCES users(id),

    -- Audit
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by      UUID        REFERENCES users(id),

    -- Soft delete
    deleted_at      TIMESTAMPTZ,
    deleted_by      UUID        REFERENCES users(id)
);

CREATE INDEX idx_comm_groups_centre ON communication_groups(centre_id) WHERE deleted_at IS NULL;

SELECT attach_updated_at_trigger('communication_groups');


-- ────────────────────────────────────────────────
-- GROUP_MEMBERS
-- ────────────────────────────────────────────────
CREATE TABLE group_members (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id    UUID        NOT NULL REFERENCES communication_groups(id) ON DELETE CASCADE,
    user_id     UUID        NOT NULL REFERENCES users(id),
    role        member_role NOT NULL DEFAULT 'MEMBER',
    joined_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    joined_by   UUID        REFERENCES users(id),    -- NULL = self-join
    left_at     TIMESTAMPTZ,
    left_by     UUID        REFERENCES users(id)
);

CREATE UNIQUE INDEX uq_group_members_active
    ON group_members(group_id, user_id)
    WHERE left_at IS NULL;

CREATE INDEX idx_group_members_user_id  ON group_members(user_id) WHERE left_at IS NULL;
CREATE INDEX idx_group_members_group_id ON group_members(group_id) WHERE left_at IS NULL;


-- ────────────────────────────────────────────────
-- GROUP_MESSAGES
-- ────────────────────────────────────────────────
CREATE TABLE group_messages (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id        UUID            NOT NULL REFERENCES communication_groups(id),
    sender_id       UUID            NOT NULL REFERENCES users(id),
    content         TEXT            NOT NULL,
    message_type    message_type    NOT NULL DEFAULT 'TEXT',
    attachment_url  VARCHAR(500),
    reply_to_id     UUID            REFERENCES group_messages(id),
    is_pinned       BOOLEAN         NOT NULL DEFAULT FALSE,
    pinned_by       UUID            REFERENCES users(id),
    pinned_at       TIMESTAMPTZ,
    sent_at         TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    -- Soft delete (allows "delete message")
    deleted_at      TIMESTAMPTZ,
    deleted_by      UUID            REFERENCES users(id)
);

CREATE INDEX idx_group_messages_group    ON group_messages(group_id, sent_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_group_messages_sender   ON group_messages(sender_id);
CREATE INDEX idx_group_messages_pinned   ON group_messages(group_id) WHERE is_pinned = TRUE AND deleted_at IS NULL;
```

---

### Migration V8.0 — Notification Domain

```sql
-- V8.0__create_notification_tables.sql

CREATE TYPE notification_channel    AS ENUM ('IN_APP', 'EMAIL', 'SMS', 'PUSH');
CREATE TYPE notification_type       AS ENUM (
    'SADHANA_REMINDER', 'EVENT_REMINDER', 'EVENT_REGISTRATION',
    'ATTENDANCE_MARKED', 'MENTOR_ASSIGNED', 'JOB_POSTED',
    'APPLICATION_STATUS', 'SEVA_OPPORTUNITY', 'ANNOUNCEMENT', 'SYSTEM'
);

-- ────────────────────────────────────────────────
-- NOTIFICATIONS
-- ────────────────────────────────────────────────
CREATE TABLE notifications (
    id              UUID                    PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID                    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    centre_id       UUID                    NOT NULL REFERENCES centres(id),
    type            notification_type       NOT NULL,
    channel         notification_channel    NOT NULL DEFAULT 'IN_APP',
    title           VARCHAR(200)            NOT NULL,
    body            TEXT                    NOT NULL,
    action_url      VARCHAR(500),           -- Deep-link URL for the notification
    reference_type  VARCHAR(60),            -- e.g. 'event', 'job_post', 'sadhana_record'
    reference_id    UUID,                   -- ID of the referenced entity
    is_read         BOOLEAN                 NOT NULL DEFAULT FALSE,
    read_at         TIMESTAMPTZ,
    sent_at         TIMESTAMPTZ             NOT NULL DEFAULT NOW(),
    delivery_status VARCHAR(30)             NOT NULL DEFAULT 'SENT',
    error_message   VARCHAR(500)            -- Capture delivery failures
);

CREATE INDEX idx_notifications_user_unread
    ON notifications(user_id, sent_at DESC)
    WHERE is_read = FALSE;

CREATE INDEX idx_notifications_user_all    ON notifications(user_id, sent_at DESC);
CREATE INDEX idx_notifications_centre      ON notifications(centre_id, sent_at DESC);
CREATE INDEX idx_notifications_reference   ON notifications(reference_type, reference_id)
    WHERE reference_id IS NOT NULL;

COMMENT ON COLUMN notifications.reference_type IS
    'Polymorphic reference to the source entity. Pair with reference_id.';


-- ────────────────────────────────────────────────
-- NOTIFICATION_PREFERENCES
-- ────────────────────────────────────────────────
CREATE TABLE notification_preferences (
    id              UUID                    PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID                    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type            notification_type       NOT NULL,
    channel         notification_channel    NOT NULL,
    is_enabled      BOOLEAN                 NOT NULL DEFAULT TRUE,
    updated_at      TIMESTAMPTZ             NOT NULL DEFAULT NOW(),

    PRIMARY KEY (id),
    CONSTRAINT uq_notification_preferences UNIQUE (user_id, type, channel)
);

CREATE INDEX idx_notification_prefs_user ON notification_preferences(user_id);

SELECT attach_updated_at_trigger('notification_preferences');
```

---

### Migration V9.0 — Preaching Domain

```sql
-- V9.0__create_preaching_tables.sql

CREATE TYPE contact_stage   AS ENUM ('INITIAL_CONTACT', 'INTERESTED', 'ATTENDING', 'REGULAR', 'INITIATED', 'LOST_CONTACT');
CREATE TYPE interest_level  AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH');
CREATE TYPE followup_outcome AS ENUM ('CONTACTED', 'NO_RESPONSE', 'MEETING_DONE', 'EVENT_INVITED', 'JOINED', 'DROPPED');

-- ────────────────────────────────────────────────
-- PREACHING_CONTACTS
-- ────────────────────────────────────────────────
CREATE TABLE preaching_contacts (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    centre_id           UUID            NOT NULL REFERENCES centres(id),
    added_by            UUID            NOT NULL REFERENCES devotee_profiles(id),
    assigned_to         UUID            REFERENCES devotee_profiles(id),  -- Counsellor/outreach officer

    -- Contact info
    name                VARCHAR(150)    NOT NULL,
    email               VARCHAR(255),
    phone               VARCHAR(20),
    phone_encrypted     BYTEA,
    dob                 DATE,
    gender              gender_type,
    city                VARCHAR(100),
    occupation          VARCHAR(150),

    -- Outreach status
    stage               contact_stage   NOT NULL DEFAULT 'INITIAL_CONTACT',
    interest_level      interest_level  NOT NULL DEFAULT 'MEDIUM',
    source              VARCHAR(100),   -- e.g. 'Book_Stall', 'Event', 'Online', 'Referral'
    referrer_devotee_id UUID            REFERENCES devotee_profiles(id),
    first_contact_date  DATE            NOT NULL DEFAULT CURRENT_DATE,
    last_followup_date  DATE,
    next_followup_date  DATE,

    notes               TEXT,
    tags                TEXT[],

    -- Audit
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    created_by          UUID            REFERENCES users(id),
    updated_by          UUID            REFERENCES users(id),

    -- Soft delete
    deleted_at          TIMESTAMPTZ,
    deleted_by          UUID            REFERENCES users(id)
);

CREATE INDEX idx_preaching_contacts_centre_stage
    ON preaching_contacts(centre_id, stage) WHERE deleted_at IS NULL;
CREATE INDEX idx_preaching_contacts_assigned_to
    ON preaching_contacts(assigned_to) WHERE deleted_at IS NULL;
CREATE INDEX idx_preaching_contacts_next_followup
    ON preaching_contacts(centre_id, next_followup_date) WHERE deleted_at IS NULL AND next_followup_date IS NOT NULL;
CREATE INDEX idx_preaching_contacts_name_trgm
    ON preaching_contacts USING GIN (name gin_trgm_ops) WHERE deleted_at IS NULL;

SELECT attach_updated_at_trigger('preaching_contacts');


-- ────────────────────────────────────────────────
-- CONTACT_FOLLOWUPS
-- ────────────────────────────────────────────────
CREATE TABLE contact_followups (
    id              UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id      UUID                NOT NULL REFERENCES preaching_contacts(id) ON DELETE CASCADE,
    done_by         UUID                NOT NULL REFERENCES devotee_profiles(id),
    followup_date   DATE                NOT NULL DEFAULT CURRENT_DATE,
    followup_method VARCHAR(60),        -- e.g. 'PHONE', 'IN_PERSON', 'WHATSAPP', 'EMAIL'
    outcome         followup_outcome    NOT NULL DEFAULT 'CONTACTED',
    notes           TEXT,
    next_followup_date DATE,
    stage_before    contact_stage,
    stage_after     contact_stage,

    -- Audit
    created_at      TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    created_by      UUID                REFERENCES users(id)
);

CREATE INDEX idx_contact_followups_contact  ON contact_followups(contact_id, followup_date DESC);
CREATE INDEX idx_contact_followups_done_by  ON contact_followups(done_by);
```

---

### Migration V10.0 — Audit Log

```sql
-- V10.0__create_audit_tables.sql

CREATE TYPE audit_operation AS ENUM ('INSERT', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'PERMISSION_CHANGE');

-- ────────────────────────────────────────────────
-- AUDIT_LOGS  (append-only — NEVER updated or deleted)
-- ────────────────────────────────────────────────
CREATE TABLE audit_logs (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID            REFERENCES users(id),      -- NULL for system actions
    centre_id       UUID            REFERENCES centres(id),
    operation       audit_operation NOT NULL,
    table_name      VARCHAR(100),
    record_id       UUID,
    old_values      JSONB,          -- Snapshot before change
    new_values      JSONB,          -- Snapshot after change
    changed_fields  TEXT[],        -- Which columns changed (UPDATE only)
    ip_address      INET,
    user_agent      TEXT,
    session_id      VARCHAR(100),   -- JWT JTI for tracing
    description     TEXT,          -- Human-readable summary
    occurred_at     TIMESTAMPTZ     NOT NULL DEFAULT NOW()

    -- No updated_at, no soft-delete — audit logs are immutable
);

-- Audit logs are write-heavy and read by date range / user / table
CREATE INDEX idx_audit_logs_occurred_at  ON audit_logs(occurred_at DESC);
CREATE INDEX idx_audit_logs_user_id      ON audit_logs(user_id, occurred_at DESC);
CREATE INDEX idx_audit_logs_centre_id    ON audit_logs(centre_id, occurred_at DESC);
CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id) WHERE record_id IS NOT NULL;
CREATE INDEX idx_audit_logs_operation    ON audit_logs(operation, occurred_at DESC);
CREATE INDEX idx_audit_logs_old_values   ON audit_logs USING GIN (old_values) WHERE old_values IS NOT NULL;
CREATE INDEX idx_audit_logs_new_values   ON audit_logs USING GIN (new_values) WHERE new_values IS NOT NULL;

COMMENT ON TABLE audit_logs IS
    'Immutable append-only audit trail. Never UPDATE or DELETE rows from this table.';

-- Prevent any UPDATE or DELETE on audit_logs at the DB level
CREATE RULE audit_logs_no_update AS ON UPDATE TO audit_logs DO INSTEAD NOTHING;
CREATE RULE audit_logs_no_delete AS ON DELETE TO audit_logs DO INSTEAD NOTHING;
```

---

### Migration V10.1 — Row-Level Security Policies

```sql
-- V10.1__create_rls_policies.sql

-- Create a DB role for the application (principle of least privilege)
-- The app connects as 'iys_app', not as superuser
DO $$ BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'iys_app') THEN
        CREATE ROLE iys_app WITH LOGIN PASSWORD 'CHANGE_IN_PROD';
    END IF;
END $$;

GRANT USAGE ON SCHEMA public TO iys_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO iys_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO iys_app;

-- ─────────────────────────────────────────────────────
-- Enable RLS on all centre-scoped tables
-- ─────────────────────────────────────────────────────
DO $$ DECLARE
    tbl TEXT;
BEGIN
    FOREACH tbl IN ARRAY ARRAY[
        'devotee_profiles', 'sadhana_records', 'sadhana_scores',
        'events', 'sessions', 'event_registrations', 'attendance_records',
        'job_posts', 'job_applications', 'seva_opportunities', 'seva_enrollments',
        'communication_groups', 'group_members', 'group_messages',
        'notifications', 'preaching_contacts', 'contact_followups',
        'mentor_assignments'
    ] LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
        EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', tbl);

        -- Policy: iys_app can only see rows for the current centre
        -- SUPER_ADMIN sets app.current_centre_id = NULL to bypass
        EXECUTE format(
            'CREATE POLICY centre_isolation ON %I FOR ALL TO iys_app
             USING (
                 centre_id = current_setting(''app.current_centre_id'', true)::UUID
                 OR current_setting(''app.is_super_admin'', true) = ''true''
             )',
            tbl
        );
    END LOOP;
END $$;
```

---

### Migration V10.2 — Seed Permissions

```sql
-- V10.2__seed_permissions.sql

INSERT INTO permissions (module, action, scope, description) VALUES
-- Devotee permissions
('devotee', 'read',   'own',    'Read own devotee profile'),
('devotee', 'read',   'centre', 'Read all devotee profiles in own centre'),
('devotee', 'read',   'all',    'Read devotee profiles across all centres'),
('devotee', 'write',  'own',    'Edit own devotee profile'),
('devotee', 'write',  'centre', 'Edit any devotee profile in own centre'),
('devotee', 'delete', 'centre', 'Soft-delete a devotee in own centre'),
-- Sadhana permissions
('sadhana', 'read',   'own',     'Read own sadhana records'),
('sadhana', 'read',   'mentees', 'Read mentees'' sadhana records'),
('sadhana', 'read',   'centre',  'Read all sadhana records in own centre'),
('sadhana', 'write',  'own',     'Submit own sadhana record'),
('sadhana', 'write',  'mentees', 'Submit sadhana on behalf of mentees'),
-- Event permissions
('event',       'read',   'centre',  'Read events in own centre'),
('event',       'write',  'centre',  'Create/edit events in own centre'),
('event',       'delete', 'centre',  'Cancel/delete events in own centre'),
('attendance',  'write',  'centre',  'Mark attendance for any session'),
('attendance',  'read',   'centre',  'View attendance reports'),
-- Career permissions
('career', 'read',   'centre',  'Read job posts in own centre'),
('career', 'write',  'centre',  'Post/edit jobs in own centre'),
('career', 'apply',  'own',     'Apply for a job'),
('career', 'read',   'applications', 'View job applications (recruiter)'),
-- Seva permissions
('seva', 'read',  'centre', 'Read seva opportunities in own centre'),
('seva', 'write', 'centre', 'Create/edit seva opportunities'),
('seva', 'enroll', 'own',   'Enroll self in seva'),
-- Preaching permissions
('preaching', 'read',  'own',    'Read own preaching contacts'),
('preaching', 'read',  'centre', 'Read all preaching contacts in own centre'),
('preaching', 'write', 'own',    'Add/edit own preaching contacts'),
('preaching', 'write', 'centre', 'Edit any preaching contact in own centre'),
-- Communication permissions
('communication', 'read',  'centre', 'Read group messages in own centre'),
('communication', 'write', 'centre', 'Send messages in groups'),
-- Notification permissions
('notification', 'read',  'own',    'Read own notifications'),
('notification', 'write', 'centre', 'Send announcements to centre'),
-- Reporting permissions
('reporting', 'read',   'centre',  'View reports for own centre'),
('reporting', 'export', 'centre',  'Export data for own centre'),
('reporting', 'read',   'all',     'View system-wide reports'),
-- Admin permissions
('admin', 'manage', 'centre', 'Full admin access for own centre'),
('admin', 'manage', 'all',    'Full system admin access'),
('centre', 'write', 'all',    'Create/modify centre records'),
('user',   'manage','centre', 'Manage users in own centre'),
('role',   'assign','centre', 'Assign roles within own centre')

ON CONFLICT DO NOTHING;
```

---

### Migration V10.3 — Seed Default Roles

```sql
-- V10.3__seed_default_roles.sql

-- ─────────────────────────────────────────────────────
-- Insert system-wide roles (centre_id = NULL)
-- ─────────────────────────────────────────────────────
INSERT INTO roles (name, description, centre_id, is_system_role) VALUES
('SUPER_ADMIN',       'Full system access across all centres',                  NULL, TRUE),
('CENTRE_ADMIN',      'Full access within their own centre',                    NULL, TRUE),
('COUNSELLOR',        'Manage assigned devotees, sadhana and follow-ups',       NULL, TRUE),
('EVENT_MANAGER',     'Create and manage events, sessions and attendance',      NULL, TRUE),
('SEVA_COORDINATOR',  'Manage seva opportunities and volunteer enrollments',    NULL, TRUE),
('OUTREACH_OFFICER',  'Manage preaching contacts and follow-up pipeline',       NULL, TRUE),
('DEVOTEE',           'Base role: own profile, sadhana submission, event reg.', NULL, TRUE)
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────
-- Assign permissions to system roles
-- Helper: assigns all permissions matching a module/action pattern to a role
-- ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION seed_role_permission(p_role_name TEXT, p_module TEXT, p_action TEXT, p_scope TEXT DEFAULT NULL)
RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
    v_role_id       UUID;
    v_permission_id UUID;
BEGIN
    SELECT id INTO v_role_id FROM roles WHERE name = p_role_name AND centre_id IS NULL;

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

-- SUPER_ADMIN → everything
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.name = 'SUPER_ADMIN' ON CONFLICT DO NOTHING;

-- CENTRE_ADMIN → all centre-scoped permissions + reporting
SELECT seed_role_permission('CENTRE_ADMIN', 'devotee',       'read',   'centre');
SELECT seed_role_permission('CENTRE_ADMIN', 'devotee',       'write',  'centre');
SELECT seed_role_permission('CENTRE_ADMIN', 'devotee',       'delete', 'centre');
SELECT seed_role_permission('CENTRE_ADMIN', 'sadhana',       'read',   'centre');
SELECT seed_role_permission('CENTRE_ADMIN', 'event',         'write',  'centre');
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

-- COUNSELLOR
SELECT seed_role_permission('COUNSELLOR', 'devotee',   'read',   'centre');
SELECT seed_role_permission('COUNSELLOR', 'devotee',   'write',  'own');
SELECT seed_role_permission('COUNSELLOR', 'sadhana',   'read',   'mentees');
SELECT seed_role_permission('COUNSELLOR', 'sadhana',   'write',  'mentees');
SELECT seed_role_permission('COUNSELLOR', 'preaching', 'read',   'centre');
SELECT seed_role_permission('COUNSELLOR', 'preaching', 'write',  'own');
SELECT seed_role_permission('COUNSELLOR', 'event',     'read',   'centre');

-- EVENT_MANAGER
SELECT seed_role_permission('EVENT_MANAGER', 'event',      'write',  'centre');
SELECT seed_role_permission('EVENT_MANAGER', 'event',      'delete', 'centre');
SELECT seed_role_permission('EVENT_MANAGER', 'attendance', 'write',  'centre');
SELECT seed_role_permission('EVENT_MANAGER', 'attendance', 'read',   'centre');
SELECT seed_role_permission('EVENT_MANAGER', 'devotee',    'read',   'centre');

-- SEVA_COORDINATOR
SELECT seed_role_permission('SEVA_COORDINATOR', 'seva',    'write',  'centre');
SELECT seed_role_permission('SEVA_COORDINATOR', 'devotee', 'read',   'centre');

-- OUTREACH_OFFICER
SELECT seed_role_permission('OUTREACH_OFFICER', 'preaching',     'read',  'centre');
SELECT seed_role_permission('OUTREACH_OFFICER', 'preaching',     'write', 'centre');
SELECT seed_role_permission('OUTREACH_OFFICER', 'communication', 'write', 'centre');
SELECT seed_role_permission('OUTREACH_OFFICER', 'devotee',       'read',  'centre');

-- DEVOTEE (base)
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
```

---

## Part 4 — Index Strategy Summary

| Table | Index type | Purpose |
|-------|-----------|---------|
| `users` | B-tree unique (partial) | Fast login by email, active-only |
| `devotee_profiles` | GIN trigram | Name search (`ILIKE '%prabhu%'`) |
| `sadhana_records` | B-tree composite | Date-range queries per devotee/centre |
| `events` | B-tree composite | Listing by centre + date + status |
| `attendance_records` | B-tree unique | Prevent duplicate check-ins |
| `job_posts` | GIN array | Filter by `skills_required @> ARRAY['Python']` |
| `notifications` | B-tree partial | Unread count badge (is_read = FALSE) |
| `audit_logs` | B-tree + GIN | Range queries; JSONB diff searches |
| `preaching_contacts` | GIN trigram | Contact name search |
| `preaching_contacts` | B-tree | Next follow-up date reminders |

---

## Part 5 — Flyway Configuration

```yaml
# application.yml
spring:
  flyway:
    enabled: true
    locations: classpath:db/migration
    baseline-on-migrate: false
    validate-on-migrate: true
    out-of-order: false
    schemas: public
    table: flyway_schema_history
    placeholders:
      app_user: iys_app
```

### Migration File Layout

```
src/main/resources/db/migration/
├── V1.0__create_extensions_and_functions.sql
├── V1.1__create_centres_table.sql
├── V1.2__create_identity_tables.sql
├── V2.0__create_devotee_tables.sql
├── V3.0__create_sadhana_tables.sql
├── V4.0__create_event_tables.sql
├── V5.0__create_career_tables.sql
├── V6.0__create_seva_tables.sql
├── V7.0__create_communication_tables.sql
├── V8.0__create_notification_tables.sql
├── V9.0__create_preaching_tables.sql
├── V10.0__create_audit_tables.sql
├── V10.1__create_rls_policies.sql
├── V10.2__seed_permissions.sql
└── V10.3__seed_default_roles.sql
```

### Rules for Writing Migrations

```
1. NEVER edit a committed migration file — create a new version instead.
2. Migrations are forward-only. No ROLLBACK scripts (use compensating migrations).
3. Non-destructive changes (add column nullable, add index) go in a minor: V2.1__.
4. Breaking schema changes (rename column, drop) go in a major: V3.0__.
5. Every migration is idempotent where possible (IF NOT EXISTS, ON CONFLICT DO NOTHING).
6. Test each migration against a clean DB in CI before merging.
7. Seed data (permissions, default roles) is in separate Vx.x files — never mixed with DDL.
```

---

## Part 6 — Soft Delete Query Pattern

```sql
-- Application-layer convention:
-- All service queries MUST add: WHERE deleted_at IS NULL
-- Use a named Spring Data specification or QueryDSL predicate:

-- Example: find active devotees for a centre
SELECT dp.* FROM devotee_profiles dp
WHERE dp.centre_id  = :centreId
  AND dp.deleted_at IS NULL
ORDER BY dp.legal_name;

-- Soft delete a devotee (never physical DELETE)
UPDATE devotee_profiles
SET deleted_at = NOW(),
    deleted_by = :actingUserId
WHERE id = :devoteeId
  AND centre_id = :centreId;

-- List "trash" (for admin restore capability)
SELECT dp.* FROM devotee_profiles dp
WHERE dp.centre_id  = :centreId
  AND dp.deleted_at IS NOT NULL
ORDER BY dp.deleted_at DESC;
```
