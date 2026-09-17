package org.iskcon.iys.shared.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;

/**
 * Unified HTTP response envelope for all IYS API endpoints.
 *
 * <p>Success shape:
 * <pre>
 * { "success": true, "data": {...}, "timestamp": "..." }
 * </pre>
 *
 * <p>Error shape:
 * <pre>
 * { "success": false, "error": { "code": "...", "message": "..." }, "timestamp": "..." }
 * </pre>
 *
 * @param <T> the type of the data payload
 */
@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    private final boolean success;
    private final T data;
    private final ApiError error;

    @Builder.Default
    private final Instant timestamp = Instant.now();

    // ── Static factory methods ──────────────────────────────────

    public static <T> ApiResponse<T> success(T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .data(data)
                .build();
    }

    public static <T> ApiResponse<T> success() {
        return ApiResponse.<T>builder()
                .success(true)
                .build();
    }

    public static <T> ApiResponse<T> error(String code, String message) {
        return ApiResponse.<T>builder()
                .success(false)
                .error(new ApiError(code, message))
                .build();
    }

    // ── Nested error body ───────────────────────────────────────

    @Getter
    public static class ApiError {
        private final String code;
        private final String message;

        public ApiError(String code, String message) {
            this.code = code;
            this.message = message;
        }
    }
}
