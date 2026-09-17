package org.iskcon.iys.shared.exception;

import org.springframework.http.HttpStatus;

/** Thrown when the user is not authenticated (missing or invalid token). Maps to HTTP 401. */
public class UnauthorizedException extends IysException {

    public UnauthorizedException(String message) {
        super(ErrorCode.UNAUTHORIZED, message, HttpStatus.UNAUTHORIZED);
    }
}
