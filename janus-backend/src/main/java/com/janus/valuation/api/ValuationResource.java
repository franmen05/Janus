package com.janus.valuation.api;

import com.janus.operation.api.dto.OperationResponse;
import com.janus.valuation.api.dto.ExternalPermitRequest;
import com.janus.valuation.api.dto.ExternalPermitResponse;
import com.janus.valuation.api.dto.LocalChargesValidatedRequest;
import com.janus.valuation.api.dto.ValuationChecklistResponse;
import com.janus.valuation.application.ValuationService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.PATCH;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.SecurityContext;
import java.util.List;

@Path("/api/operations/{operationId}/valuation")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ValuationResource {

    @Inject
    ValuationService valuationService;

    // ── Checklist ──

    @GET
    @Path("/checklist")
    @RolesAllowed({"ADMIN", "SUPERVISOR", "AGENT", "ACCOUNTING"})
    public ValuationChecklistResponse getChecklist(@PathParam("operationId") Long operationId) {
        return valuationService.getChecklist(operationId);
    }

    // ── Permits ──

    @GET
    @Path("/permits")
    @RolesAllowed({"ADMIN", "SUPERVISOR", "AGENT", "ACCOUNTING"})
    @Transactional
    public List<ExternalPermitResponse> getPermits(@PathParam("operationId") Long operationId) {
        return valuationService.getPermits(operationId).stream()
                .map(ExternalPermitResponse::from)
                .toList();
    }

    @POST
    @Path("/permits")
    @RolesAllowed({"ADMIN", "SUPERVISOR", "AGENT"})
    public Response createPermit(@PathParam("operationId") Long operationId,
                                  @Valid ExternalPermitRequest request,
                                  @Context SecurityContext sec) {
        var permit = valuationService.createPermit(operationId, request, sec.getUserPrincipal().getName());
        return Response.status(Response.Status.CREATED)
                .entity(ExternalPermitResponse.from(permit))
                .build();
    }

    @PUT
    @Path("/permits/{permitId}")
    @RolesAllowed({"ADMIN", "SUPERVISOR", "AGENT"})
    public ExternalPermitResponse updatePermit(@PathParam("operationId") Long operationId,
                                                @PathParam("permitId") Long permitId,
                                                @Valid ExternalPermitRequest request,
                                                @Context SecurityContext sec) {
        var permit = valuationService.updatePermit(operationId, permitId, request, sec.getUserPrincipal().getName());
        return ExternalPermitResponse.from(permit);
    }

    @DELETE
    @Path("/permits/{permitId}")
    @RolesAllowed({"ADMIN", "SUPERVISOR", "AGENT"})
    public Response deletePermit(@PathParam("operationId") Long operationId,
                                  @PathParam("permitId") Long permitId,
                                  @Context SecurityContext sec) {
        valuationService.deletePermit(operationId, permitId, sec.getUserPrincipal().getName());
        return Response.noContent().build();
    }

    // ── Finalize ──

    @POST
    @Path("/finalize")
    @RolesAllowed({"ADMIN", "SUPERVISOR", "AGENT"})
    public Response finalizeValuation(@PathParam("operationId") Long operationId,
                                       @Context SecurityContext sec) {
        valuationService.finalizeValuation(operationId, sec.getUserPrincipal().getName());
        return Response.ok().build();
    }

    // ── Local charges ──

    @POST
    @Path("/validate-local-charges")
    @RolesAllowed({"ADMIN", "SUPERVISOR", "AGENT"})
    public OperationResponse validateLocalCharges(@PathParam("operationId") Long operationId,
                                                   @Context SecurityContext sec) {
        var op = valuationService.toggleLocalChargesValidated(operationId, true, sec.getUserPrincipal().getName());
        return OperationResponse.from(op);
    }

    @PATCH
    @Path("/local-charges-validated")
    @RolesAllowed({"ADMIN", "SUPERVISOR", "AGENT"})
    public OperationResponse toggleLocalChargesValidated(@PathParam("operationId") Long operationId,
                                                          @Valid LocalChargesValidatedRequest body,
                                                          @Context SecurityContext sec) {
        var op = valuationService.toggleLocalChargesValidated(operationId, body.validated(), sec.getUserPrincipal().getName());
        return OperationResponse.from(op);
    }
}
