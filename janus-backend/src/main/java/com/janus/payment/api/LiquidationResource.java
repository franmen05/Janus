package com.janus.payment.api;

import com.janus.operation.application.OperationService;
import com.janus.payment.api.dto.ApprovalRequest;
import com.janus.payment.api.dto.GenerateLiquidationRequest;
import com.janus.payment.api.dto.LiquidationResponse;
import com.janus.payment.api.dto.MakeDefinitiveRequest;
import com.janus.payment.api.dto.PaymentResponse;
import com.janus.payment.api.dto.RegisterPaymentRequest;
import com.janus.payment.application.LiquidationService;
import com.janus.compliance.domain.repository.ComplianceRuleConfigRepository;
import com.janus.shared.infrastructure.security.SecurityHelper;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.SecurityContext;

@Path("/api/operations/{operationId}/liquidation")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class LiquidationResource {

    @Inject
    LiquidationService liquidationService;

    @Inject
    OperationService operationService;

    @Inject
    SecurityHelper securityHelper;

    @Inject
    ComplianceRuleConfigRepository complianceRuleConfigRepository;

    @POST
    @RolesAllowed({"ADMIN", "AGENT"})
    @Transactional
    public Response generateLiquidation(@PathParam("operationId") Long operationId,
                                         GenerateLiquidationRequest request,
                                         @Context SecurityContext sec) {
        var username = sec.getUserPrincipal().getName();
        var agencyFee = request != null ? request.agencyServiceFee() : null;
        var liquidation = liquidationService.generateLiquidation(operationId, agencyFee, username);
        return Response.status(Response.Status.CREATED)
                .entity(LiquidationResponse.from(liquidation))
                .build();
    }

    @GET
    @RolesAllowed({"ADMIN", "AGENT", "ACCOUNTING", "CUSTOMER"})
    @Transactional
    public Response getLiquidation(@PathParam("operationId") Long operationId,
                                    @Context SecurityContext sec) {
        securityHelper.enforceCustomerAccess(sec, operationService.findById(operationId));
        var liquidation = liquidationService.getLiquidation(operationId);
        if (liquidation == null) {
            return Response.noContent().build();
        }
        return Response.ok(LiquidationResponse.from(liquidation)).build();
    }

    @POST
    @Path("/approve")
    @RolesAllowed({"ADMIN"})
    @Transactional
    public Response approveLiquidation(@PathParam("operationId") Long operationId,
                                        ApprovalRequest request,
                                        @Context SecurityContext sec) {
        var username = sec.getUserPrincipal().getName();
        var comment = request != null ? request.comment() : null;
        var liquidation = liquidationService.approveLiquidation(operationId, comment, username);
        return Response.ok(LiquidationResponse.from(liquidation)).build();
    }

    @POST
    @Path("/definitive")
    @RolesAllowed({"ADMIN", "AGENT"})
    @Transactional
    public Response makeLiquidationDefinitive(@PathParam("operationId") Long operationId,
                                               @Context SecurityContext sec) {
        var username = sec.getUserPrincipal().getName();
        var liquidation = liquidationService.makeLiquidationDefinitive(
                operationId, username);
        return Response.ok(LiquidationResponse.from(liquidation)).build();
    }

    @POST
    @Path("/payment")
    @RolesAllowed({"ADMIN", "AGENT"})
    public Response registerPayment(@PathParam("operationId") Long operationId,
                                     @Valid RegisterPaymentRequest request,
                                     @Context SecurityContext sec) {
        var username = sec.getUserPrincipal().getName();
        var payment = liquidationService.registerPayment(operationId, request, username);
        return Response.status(Response.Status.CREATED)
                .entity(PaymentResponse.from(payment))
                .build();
    }

    @GET
    @Path("/payment")
    @RolesAllowed({"ADMIN", "AGENT", "ACCOUNTING", "CUSTOMER"})
    @Transactional
    public Response getPayment(@PathParam("operationId") Long operationId,
                                @Context SecurityContext sec) {
        securityHelper.enforceCustomerAccess(sec, operationService.findById(operationId));
        var payment = liquidationService.getPayment(operationId);
        if (payment == null) {
            return Response.noContent().build();
        }
        return Response.ok(PaymentResponse.from(payment)).build();
    }

    @GET
    @Path("/config")
    @RolesAllowed({"ADMIN", "AGENT", "ACCOUNTING", "CUSTOMER"})
    public Response getLiquidationConfig() {
        boolean approvalRequired = complianceRuleConfigRepository.isRuleEnabled("LIQUIDATION_APPROVAL_REQUIRED");
        return Response.ok(java.util.Map.of("approvalRequired", approvalRequired)).build();
    }
}
