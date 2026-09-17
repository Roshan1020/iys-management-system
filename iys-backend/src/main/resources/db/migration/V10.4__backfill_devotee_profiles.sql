-- V10.4__backfill_devotee_profiles.sql
-- Ensure all registered users have a 1:1 devotee_profile record

INSERT INTO devotee_profiles (
    user_id,
    centre_id,
    legal_name,
    profile_type,
    initiation_status,
    phone,
    join_date,
    is_regular,
    created_at,
    updated_at
)
SELECT 
    u.id,
    u.centre_id,
    COALESCE(INITCAP(SPLIT_PART(u.email, '@', 1)), 'Devotee'),
    'OTHER'::profile_type,
    'UNINITIATED'::initiation_status,
    u.phone,
    CURRENT_DATE,
    TRUE,
    NOW(),
    NOW()
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM devotee_profiles dp WHERE dp.user_id = u.id
);
