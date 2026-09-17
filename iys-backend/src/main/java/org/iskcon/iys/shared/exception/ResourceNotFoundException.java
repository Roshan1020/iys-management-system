package org.iskcon.iys.shared.exception;

import org.springframework.http.HttpStatus;

/** Thrown when a requested resource (entity) is not found in the database. */
public class ResourceNotFoundException extends IysException {

    public ResourceNotFoundException(String errorCode, String message) {
        super(errorCode, message, HttpStatus.NOT_FOUND);
    }

    public ResourceNotFoundException(String message) {
        super(ErrorCode.RESOURCE_NOT_FOUND, message, HttpStatus.NOT_FOUND);
    }

    /** Convenience factory: {@code ResourceNotFoundException.of("User", id)} */
    public static ResourceNotFoundException of(String resourceName, Object id) {
        return new ResourceNotFoundException(
                ErrorCode.RESOURCE_NOT_FOUND,
                resourceName + " not found with id: " + id
        );
    }
}
