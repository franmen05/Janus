package com.janus.shared.infrastructure.exception;

public class NotFoundException extends RuntimeException {

    public NotFoundException(String entity, Object id) {
        super(entity + " not found with id: " + id);
    }
}
