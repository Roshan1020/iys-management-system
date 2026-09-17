package org.iskcon.iys.shared.exception;

/**
 * Domain-specific error codes used across all IYS modules.
 * These are stable string codes returned in {@code ApiResponse.error.code}.
 */
public final class ErrorCode {

    private ErrorCode() {}

    // ── Generic ────────────────────────────────────────────────
    public static final String INTERNAL_ERROR         = "INTERNAL_ERROR";
    public static final String VALIDATION_FAILED      = "VALIDATION_FAILED";
    public static final String INVALID_ARGUMENT       = "INVALID_ARGUMENT";
    public static final String RESOURCE_NOT_FOUND     = "RESOURCE_NOT_FOUND";
    public static final String DUPLICATE_RESOURCE     = "DUPLICATE_RESOURCE";
    public static final String OPERATION_NOT_ALLOWED  = "OPERATION_NOT_ALLOWED";

    // ── Security / Auth ────────────────────────────────────────
    public static final String UNAUTHORIZED           = "UNAUTHORIZED";
    public static final String FORBIDDEN              = "FORBIDDEN";
    public static final String INVALID_CREDENTIALS    = "INVALID_CREDENTIALS";
    public static final String ACCOUNT_LOCKED         = "ACCOUNT_LOCKED";
    public static final String ACCOUNT_INACTIVE       = "ACCOUNT_INACTIVE";
    public static final String TOKEN_EXPIRED          = "TOKEN_EXPIRED";
    public static final String TOKEN_INVALID          = "TOKEN_INVALID";
    public static final String TOKEN_REVOKED          = "TOKEN_REVOKED";

    // ── Identity ───────────────────────────────────────────────
    public static final String USER_NOT_FOUND         = "USER_NOT_FOUND";
    public static final String EMAIL_ALREADY_EXISTS   = "EMAIL_ALREADY_EXISTS";
    public static final String ROLE_NOT_FOUND         = "ROLE_NOT_FOUND";
    public static final String ROLE_ALREADY_ASSIGNED  = "ROLE_ALREADY_ASSIGNED";

    // ── Centre ─────────────────────────────────────────────────
    public static final String CENTRE_NOT_FOUND       = "CENTRE_NOT_FOUND";
    public static final String CENTRE_CODE_EXISTS     = "CENTRE_CODE_EXISTS";
    public static final String CENTRE_ACCESS_DENIED   = "CENTRE_ACCESS_DENIED";

    // ── Devotee ────────────────────────────────────────────────
    public static final String DEVOTEE_NOT_FOUND      = "DEVOTEE_NOT_FOUND";
    public static final String DEVOTEE_PROFILE_EXISTS = "DEVOTEE_PROFILE_EXISTS";
}
