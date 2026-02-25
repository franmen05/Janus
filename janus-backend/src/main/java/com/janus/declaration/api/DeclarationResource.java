package com.janus.declaration.api;

import com.janus.declaration.api.dto.ApprovalRequest;
import com.janus.declaration.api.dto.CreateDeclarationRequest;
import com.janus.declaration.api.dto.CreateTariffLineRequest;
import com.janus.declaration.api.dto.RegisterDuaRequest;
import com.janus.declaration.api.dto.CrossingDiscrepancyResponse;
import com.janus.declaration.api.dto.CrossingResultResponse;
import com.janus.declaration.api.dto.DeclarationResponse;
import com.janus.declaration.api.dto.ResolveCrossingRequest;
import com.janus.declaration.api.dto.TariffLineResponse;
import com.janus.declaration.application.DeclarationService;
import com.janus.declaration.domain.model.Declaration;
import com.janus.declaration.domain.model.TariffLine;
import com.janus.operation.application.OperationService;
import com.janus.shared.infrastructure.security.SecurityHelper;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
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

@Path("/api/operations/{operationId}/declarations")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class DeclarationResource {

    @Inject
    DeclarationService declarationService;

    @Inject
    OperationService operationService;

    @Inject
    SecurityHelper securityHelper;

    @POST
    @Path("/preliminary")
    @RolesAllowed({"ADMIN", "AGENT"})
    public Response registerPreliminary(@PathParam("operationId") Long operationId,
                                         CreateDeclarationRequest request,
                                         @Context SecurityContext sec) {
        var decl = toDeclaration(request);
        var result = declarationService.registerPreliminary(operationId, decl, sec.getUserPrincipal().getName());
        return Response.status(Response.Status.CREATED).entity(DeclarationResponse.from(result)).build();
    }

    @POST
    @Path("/final")
    @RolesAllowed({"ADMIN", "AGENT"})
    public Response registerFinal(@PathParam("operationId") Long operationId,
                                   CreateDeclarationRequest request,
                                   @Context SecurityContext sec) {
        var decl = toDeclaration(request);
        var result = declarationService.registerFinal(operationId, decl, sec.getUserPrincipal().getName());
        return Response.status(Response.Status.CREATED).entity(DeclarationResponse.from(result)).build();
    }

    @GET
    @RolesAllowed({"ADMIN", "AGENT", "ACCOUNTING"})
    public List<DeclarationResponse> list(@PathParam("operationId") Long operationId) {
        return declarationService.findByOperationId(operationId).stream()
                .map(DeclarationResponse::from)
                .toList();
    }

    @GET
    @Path("/{id}")
    @RolesAllowed({"ADMIN", "AGENT", "ACCOUNTING"})
    public DeclarationResponse getById(@PathParam("operationId") Long operationId,
                                        @PathParam("id") Long id) {
        return DeclarationResponse.from(declarationService.findById(operationId, id));
    }

    @PUT
    @Path("/{id}")
    @RolesAllowed({"ADMIN", "AGENT"})
    public DeclarationResponse update(@PathParam("operationId") Long operationId,
                                       @PathParam("id") Long declarationId,
                                       CreateDeclarationRequest request,
                                       @Context SecurityContext sec) {
        var decl = toDeclaration(request);
        var result = declarationService.updateDeclaration(operationId, declarationId, decl, sec.getUserPrincipal().getName());
        return DeclarationResponse.from(result);
    }

    @POST
    @Path("/{id}/tariff-lines")
    @RolesAllowed({"ADMIN", "AGENT"})
    public Response addTariffLine(@PathParam("operationId") Long operationId,
                                   @PathParam("id") Long declarationId,
                                   @Valid CreateTariffLineRequest request,
                                   @Context SecurityContext sec) {
        var line = toTariffLine(request);
        var result = declarationService.addTariffLine(operationId, declarationId, line,
                sec.getUserPrincipal().getName());
        return Response.status(Response.Status.CREATED).entity(TariffLineResponse.from(result)).build();
    }

    @GET
    @Path("/{id}/tariff-lines")
    @RolesAllowed({"ADMIN", "AGENT", "ACCOUNTING"})
    public List<TariffLineResponse> getTariffLines(@PathParam("operationId") Long operationId,
                                                    @PathParam("id") Long declarationId) {
        return declarationService.getTariffLines(operationId, declarationId).stream()
                .map(TariffLineResponse::from)
                .toList();
    }

    @POST
    @Path("/crossing/execute")
    @RolesAllowed({"ADMIN", "AGENT"})
    public Response executeCrossing(@PathParam("operationId") Long operationId,
                                     @Context SecurityContext sec) {
        var result = declarationService.executeCrossing(operationId, sec.getUserPrincipal().getName());
        var discrepancies = declarationService.getDiscrepancies(result.id).stream()
                .map(CrossingDiscrepancyResponse::from)
                .toList();
        return Response.status(Response.Status.CREATED)
                .entity(CrossingResultResponse.from(result, discrepancies))
                .build();
    }

    @POST
    @Path("/crossing/resolve")
    @RolesAllowed({"ADMIN", "AGENT"})
    public CrossingResultResponse resolveCrossing(@PathParam("operationId") Long operationId,
                                                   @Valid ResolveCrossingRequest request,
                                                   @Context SecurityContext sec) {
        var result = declarationService.resolveCrossing(operationId, request.comment(),
                sec.getUserPrincipal().getName());
        var discrepancies = declarationService.getDiscrepancies(result.id).stream()
                .map(CrossingDiscrepancyResponse::from)
                .toList();
        return CrossingResultResponse.from(result, discrepancies);
    }

    @GET
    @Path("/crossing")
    @RolesAllowed({"ADMIN", "AGENT", "ACCOUNTING", "CLIENT"})
    public Response getCrossing(@PathParam("operationId") Long operationId,
                                 @Context SecurityContext sec) {
        securityHelper.enforceClientAccess(sec, operationService.findById(operationId));
        var result = declarationService.getCrossingResult(operationId);
        if (result == null) {
            return Response.noContent().build();
        }
        var discrepancies = declarationService.getDiscrepancies(result.id).stream()
                .map(CrossingDiscrepancyResponse::from)
                .toList();
        return Response.ok(CrossingResultResponse.from(result, discrepancies)).build();
    }

    private Declaration toDeclaration(CreateDeclarationRequest r) {
        var d = new Declaration();
        d.declarationNumber = r.declarationNumber();
        d.fobValue = r.fobValue();
        d.cifValue = r.cifValue();
        d.taxableBase = r.taxableBase();
        d.totalTaxes = r.totalTaxes();
        d.freightValue = r.freightValue();
        d.insuranceValue = r.insuranceValue();
        d.gattMethod = r.gattMethod();
        d.notes = r.notes();
        return d;
    }

    @POST
    @Path("/{id}/generate-preliquidation")
    @RolesAllowed({"ADMIN", "AGENT"})
    public DeclarationResponse generatePreliquidation(@PathParam("operationId") Long operationId,
                                                       @PathParam("id") Long declarationId,
                                                       @Context SecurityContext sec) {
        var result = declarationService.generatePreliquidation(operationId, declarationId,
                sec.getUserPrincipal().getName());
        return DeclarationResponse.from(result);
    }

    @POST
    @Path("/{id}/approve-technical")
    @RolesAllowed({"ADMIN", "AGENT"})
    public DeclarationResponse approveTechnical(@PathParam("operationId") Long operationId,
                                                 @PathParam("id") Long declarationId,
                                                 ApprovalRequest request,
                                                 @Context SecurityContext sec) {
        var comment = request != null ? request.comment() : null;
        var result = declarationService.approveTechnical(operationId, declarationId, comment,
                sec.getUserPrincipal().getName());
        return DeclarationResponse.from(result);
    }

    @POST
    @Path("/{id}/approve-final")
    @RolesAllowed({"ADMIN"})
    public DeclarationResponse approveFinal(@PathParam("operationId") Long operationId,
                                             @PathParam("id") Long declarationId,
                                             ApprovalRequest request,
                                             @Context SecurityContext sec) {
        var comment = request != null ? request.comment() : null;
        var result = declarationService.approveFinal(operationId, declarationId, comment,
                sec.getUserPrincipal().getName());
        return DeclarationResponse.from(result);
    }

    @POST
    @Path("/{id}/reject")
    @RolesAllowed({"ADMIN", "AGENT"})
    public DeclarationResponse reject(@PathParam("operationId") Long operationId,
                                       @PathParam("id") Long declarationId,
                                       ApprovalRequest request,
                                       @Context SecurityContext sec) {
        var comment = request != null ? request.comment() : null;
        var result = declarationService.reject(operationId, declarationId, comment,
                sec.getUserPrincipal().getName());
        return DeclarationResponse.from(result);
    }

    @POST
    @Path("/{id}/register-dua")
    @RolesAllowed({"ADMIN", "AGENT"})
    public DeclarationResponse registerDua(@PathParam("operationId") Long operationId,
                                            @PathParam("id") Long declarationId,
                                            @Valid RegisterDuaRequest request,
                                            @Context SecurityContext sec) {
        var result = declarationService.registerDua(operationId, declarationId,
                request.duaNumber(), sec.getUserPrincipal().getName());
        return DeclarationResponse.from(result);
    }

    @POST
    @Path("/{id}/submit-to-dga")
    @RolesAllowed({"ADMIN", "AGENT"})
    public DeclarationResponse submitToDga(@PathParam("operationId") Long operationId,
                                            @PathParam("id") Long declarationId,
                                            @Context SecurityContext sec) {
        var result = declarationService.submitToDga(operationId, declarationId,
                sec.getUserPrincipal().getName());
        return DeclarationResponse.from(result);
    }

    private TariffLine toTariffLine(CreateTariffLineRequest r) {
        var t = new TariffLine();
        t.lineNumber = r.lineNumber();
        t.tariffCode = r.tariffCode();
        t.description = r.description();
        t.quantity = r.quantity();
        t.unitValue = r.unitValue();
        t.totalValue = r.totalValue();
        t.taxRate = r.taxRate();
        t.taxAmount = r.taxAmount();
        return t;
    }
}
