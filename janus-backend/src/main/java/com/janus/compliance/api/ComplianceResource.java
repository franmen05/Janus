package com.janus.compliance.api;

import com.janus.compliance.domain.model.ValidationResult;
import com.janus.compliance.domain.service.ComplianceValidationService;
import com.janus.operation.application.OperationService;
import com.janus.operation.domain.model.OperationStatus;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;

@Path("/api/operations/{operationId}/compliance")
@Produces(MediaType.APPLICATION_JSON)
public class ComplianceResource {

    @Inject
    ComplianceValidationService complianceValidationService;

    @Inject
    OperationService operationService;

    @GET
    @Path("/validate")
    @RolesAllowed({"ADMIN", "AGENT"})
    public ValidationResult dryRun(@PathParam("operationId") Long operationId,
                                    @QueryParam("targetStatus") OperationStatus targetStatus) {
        var operation = operationService.findById(operationId);
        return complianceValidationService.validate(operation, targetStatus);
    }
}
