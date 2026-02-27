package com.janus.shared.infrastructure.exception;

import jakarta.validation.ConstraintViolationException;
import jakarta.ws.rs.ForbiddenException;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;
import java.util.Map;
import java.util.stream.Collectors;
import org.jboss.logging.Logger;

@Provider
public class GlobalExceptionMapper implements ExceptionMapper<Exception> {

    private static final Logger LOG = Logger.getLogger(GlobalExceptionMapper.class);

    @Override
    public Response toResponse(Exception exception) {
        if (exception instanceof ForbiddenException) {
            return Response.status(Response.Status.FORBIDDEN)
                    .entity(Map.of("error", exception.getMessage()))
                    .build();
        }

        if (exception instanceof NotFoundException) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", exception.getMessage()))
                    .build();
        }

        if (exception instanceof BusinessException be) {
            if (be.getErrorCode() != null) {
                return Response.status(Response.Status.BAD_REQUEST)
                        .entity(Map.of("error", be.getMessage(), "errorCode", be.getErrorCode()))
                        .build();
            }
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", be.getMessage()))
                    .build();
        }

        if (exception instanceof ConstraintViolationException cve) {
            var violations = cve.getConstraintViolations().stream()
                    .map(v -> v.getPropertyPath() + ": " + v.getMessage())
                    .collect(Collectors.toList());
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", "Validation failed", "violations", violations))
                    .build();
        }

        LOG.error("Unhandled exception", exception);
        return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(Map.of("error", "Internal server error"))
                .build();
    }
}
