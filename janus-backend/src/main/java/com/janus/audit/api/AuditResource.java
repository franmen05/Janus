package com.janus.audit.api;

import com.janus.audit.api.dto.AuditLogResponse;
import com.janus.audit.application.AuditService;
import com.janus.operation.application.OperationService;
import com.janus.shared.infrastructure.security.SecurityHelper;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.SecurityContext;
import java.util.List;

@Path("/api/audit")
@Produces(MediaType.APPLICATION_JSON)
public class AuditResource {

    @Inject
    AuditService auditService;

    @Inject
    SecurityHelper securityHelper;

    @Inject
    OperationService operationService;

    @GET
    @RolesAllowed("ADMIN")
    public List<AuditLogResponse> list(@QueryParam("username") String username) {
        if (username != null && !username.isBlank()) {
            return auditService.findByUsername(username).stream()
                    .map(AuditLogResponse::from)
                    .toList();
        }
        return auditService.findAll().stream()
                .map(AuditLogResponse::from)
                .toList();
    }

    @GET
    @Path("/operations/{operationId}")
    @RolesAllowed({"ADMIN", "AGENT", "CLIENT"})
    public List<AuditLogResponse> getByOperation(@PathParam("operationId") Long operationId,
                                                  @Context SecurityContext sec) {
        securityHelper.enforceClientAccess(sec, operationService.findById(operationId));
        return auditService.findByOperationId(operationId).stream()
                .map(AuditLogResponse::from)
                .toList();
    }
}
