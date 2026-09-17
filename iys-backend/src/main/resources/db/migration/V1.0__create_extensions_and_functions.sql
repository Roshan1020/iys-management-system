-- V1.0__create_extensions_and_functions.sql
-- PostgreSQL extensions and shared utility functions

-- Required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pg_trgm";    -- ILIKE trigram search on names
CREATE EXTENSION IF NOT EXISTS "btree_gin";  -- Composite GIN indexes

-- ─────────────────────────────────────────────────────────────────────────────
-- fn_set_updated_at(): trigger function to auto-maintain updated_at column
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- attach_updated_at_trigger(): helper to attach the trigger to any table
-- Usage: SELECT attach_updated_at_trigger('my_table');
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION attach_updated_at_trigger(p_table TEXT)
RETURNS VOID
LANGUAGE plpgsql AS $$
BEGIN
    EXECUTE format(
        'CREATE TRIGGER trg_%I_updated_at
         BEFORE UPDATE ON %I
         FOR EACH ROW
         EXECUTE FUNCTION fn_set_updated_at()',
        p_table, p_table
    );
END;
$$;
