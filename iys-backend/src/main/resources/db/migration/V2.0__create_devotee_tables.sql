-- V2.0__create_devotee_tables.sql
-- Devotee domain: core profile + three sub-type extension tables.

-- ─────────────────────────────────────────────────────────────────────────────
-- ENUM TYPES
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TYPE profile_type      AS ENUM ('STUDENT', 'WORKING_PROFESSIONAL', 'ALUMNI', 'OTHER');
CREATE TYPE initiation_status AS ENUM ('UNINITIATED', 'FIRST_INITIATED', 'SECOND_INITIATED');
CREATE TYPE employment_type   AS ENUM ('FULL_TIME', 'PART_TIME', 'SELF_EMPLOYED', 'FREELANCER', 'NOT_WORKING');

-- ─────────────────────────────────────────────────────────────────────────────
-- DEVOTEE_PROFILES  (1:1 extension of users)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE devotee_profiles (
    id                  UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID                NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    centre_id           UUID                NOT NULL REFERENCES centres(id),

    -- Spiritual identity
    initiated_name      VARCHAR(150),
    legal_name          VARCHAR(150)        NOT NULL,
    spiritual_master    VARCHAR(150),
    initiation_status   initiation_status   NOT NULL DEFAULT 'UNINITIATED',
    initiated_date      DATE,

    -- Demographics
    dob                 DATE,
    gender              gender_type,
    profile_type        profile_type        NOT NULL DEFAULT 'OTHER',
    profile_photo_url   VARCHAR(500),

    -- Contact
    phone               VARCHAR(20),
    address             TEXT,
    city                VARCHAR(100),
    state               VARCHAR(100),
    pincode             VARCHAR(10),

    -- Programme info
    join_date           DATE                NOT NULL DEFAULT CURRENT_DATE,
    is_regular          BOOLEAN             NOT NULL DEFAULT FALSE,
    notes               TEXT,

    -- Audit
    created_at          TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    created_by          UUID                REFERENCES users(id),
    updated_by          UUID                REFERENCES users(id),

    -- Soft delete
    deleted_at          TIMESTAMPTZ,
    deleted_by          UUID                REFERENCES users(id),

    -- Constraints
    CONSTRAINT chk_devotee_initiated_date
        CHECK (initiated_date IS NULL OR dob IS NULL OR initiated_date >= dob),
    CONSTRAINT chk_devotee_initiated_fields
        CHECK (
            initiation_status = 'UNINITIATED'
            OR (initiation_status != 'UNINITIATED' AND initiated_name IS NOT NULL)
        )
);

CREATE INDEX idx_devotee_profiles_centre_id
    ON devotee_profiles(centre_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_devotee_profiles_user_id
    ON devotee_profiles(user_id);
CREATE INDEX idx_devotee_profiles_profile_type
    ON devotee_profiles(centre_id, profile_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_devotee_profiles_join_date
    ON devotee_profiles(centre_id, join_date DESC) WHERE deleted_at IS NULL;

-- Trigram index for fuzzy name search
CREATE INDEX idx_devotee_profiles_legal_name_trgm
    ON devotee_profiles USING GIN (legal_name gin_trgm_ops)
    WHERE deleted_at IS NULL;
CREATE INDEX idx_devotee_profiles_initiated_name_trgm
    ON devotee_profiles USING GIN (initiated_name gin_trgm_ops)
    WHERE deleted_at IS NULL AND initiated_name IS NOT NULL;

SELECT attach_updated_at_trigger('devotee_profiles');

COMMENT ON TABLE devotee_profiles IS 'Core devotee identity. 1:1 with users. Extended by sub-type tables.';

-- ─────────────────────────────────────────────────────────────────────────────
-- STUDENT_PROFILES
-- ─────────────────────────────────────────────────────────────────────────────
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

-- ─────────────────────────────────────────────────────────────────────────────
-- PROFESSIONAL_PROFILES
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE professional_profiles (
    id                  UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
    devotee_id          UUID                NOT NULL UNIQUE REFERENCES devotee_profiles(id) ON DELETE CASCADE,
    company             VARCHAR(200),
    designation         VARCHAR(150),
    industry            VARCHAR(100),
    employment_type     employment_type     NOT NULL DEFAULT 'FULL_TIME',
    experience_years    SMALLINT,
    annual_income_range VARCHAR(50),
    linkedin_url        VARCHAR(500),
    is_mentor_willing   BOOLEAN             NOT NULL DEFAULT FALSE,

    created_at          TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ         NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_professional_experience CHECK (experience_years IS NULL OR experience_years >= 0)
);
SELECT attach_updated_at_trigger('professional_profiles');

-- ─────────────────────────────────────────────────────────────────────────────
-- ALUMNI_PROFILES
-- ─────────────────────────────────────────────────────────────────────────────
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
