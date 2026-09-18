package org.iskcon.iys.shared.exception;

import org.springframework.http.HttpStatus;

public class BadRequestException extends IysException {

    public BadRequestException(String message) {
        super(ErrorCode.INVALID_ARGUMENT, message, HttpStatus.BAD_REQUEST);
    }

    public BadRequestException(String errorCode, String message) {
        super(errorCode, message, HttpStatus.BAD_REQUEST);
    }
}
