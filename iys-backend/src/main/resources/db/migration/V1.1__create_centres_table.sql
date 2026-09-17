-- V1.1__create_centres_table.sql
-- Top-level tenant entity: every piece of user data belongs to a centre.

CREATE TABLE centres (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(150)    NOT NULL,
    short_code      VARCHAR(10)     NOT NULL,
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
    created_by      UUID,           -- FK added later after users table exists
    updated_by      UUID,

    -- Soft delete
    deleted_at      TIMESTAMPTZ,
    deleted_by      UUID
);

-- Active short codes must be unique
CREATE UNIQUE INDEX uq_centres_short_code
    ON centres(short_code)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_centres_is_active
    ON centres(is_active)
    WHERE deleted_at IS NULL;

SELECT attach_updated_at_trigger('centres');

COMMENT ON TABLE centres IS 'Top-level tenant entity. All user and devotee data belongs to a centre.';
COMMENT ON COLUMN centres.short_code IS 'Short identifier for display: e.g. MUM, BNG, DEL.';
