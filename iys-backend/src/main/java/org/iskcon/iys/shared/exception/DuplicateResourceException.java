package org.iskcon.iys.shared.exception;

import org.springframework.http.HttpStatus;

/** Thrown when attempting to create a resource that already exists (unique constraint violation). */
public class DuplicateResourceException extends IysException {

    public DuplicateResourceException(String errorCode, String message) {
        super(errorCode, message, HttpStatus.CONFLICT);
    }

    public DuplicateResourceException(String message) {
        super(ErrorCode.DUPLICATE_RESOURCE, message, HttpStatus.CONFLICT);
    }
}
