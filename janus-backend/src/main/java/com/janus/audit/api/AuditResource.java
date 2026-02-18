package com.janus.audit.api;

import com.janus.audit.api.dto.AuditLogResponse;
import com.janus.audit.application.AuditService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import java.util.List;

@Path("/api/audit")
@Produces(MediaType.APPLICATION_JSON)
public class AuditResource {

    @Inject
    AuditService auditService;

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
    @RolesAllowed({"ADMIN", "AGENT"})
    public List<AuditLogResponse> getByOperation(@PathParam("operationId") Long operationId) {
        return auditService.findByOperationId(operationId).stream()
                .map(AuditLogResponse::from)
                .toList();
    }
}
