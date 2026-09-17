package org.iskcon.iys.shared.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

/**
 * Base runtime exception for all IYS domain errors.
 * Subclasses provide more specific semantics.
 */
@Getter
public class IysException extends RuntimeException {

    private final String errorCode;
    private final HttpStatus httpStatus;

    public IysException(String errorCode, String message, HttpStatus httpStatus) {
        super(message);
        this.errorCode  = errorCode;
        this.httpStatus = httpStatus;
    }

    public IysException(String errorCode, String message, HttpStatus httpStatus, Throwable cause) {
        super(message, cause);
        this.errorCode  = errorCode;
        this.httpStatus = httpStatus;
    }
}
