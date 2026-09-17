package org.iskcon.iys.shared.exception;

import org.springframework.http.HttpStatus;

/** Thrown when the authenticated user lacks permission to access a resource. Maps to HTTP 403. */
public class ForbiddenException extends IysException {

    public ForbiddenException(String message) {
        super(ErrorCode.FORBIDDEN, message, HttpStatus.FORBIDDEN);
    }

    public ForbiddenException() {
        super(ErrorCode.FORBIDDEN, "Access denied: insufficient permissions.", HttpStatus.FORBIDDEN);
    }
}
