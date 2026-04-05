package com.janus.payment.api;

import com.janus.payment.api.dto.PaymentResponse;
import com.janus.payment.api.dto.RegisterPaymentRequest;
import com.janus.payment.application.LiquidationService;
import com.janus.shared.infrastructure.security.ExternalApiKeyFilter;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/api/external/operations/{operationId}/liquidation/payment")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ExternalPaymentResource {

    @Inject
    LiquidationService liquidationService;

    @POST
    public Response registerPayment(@PathParam("operationId") Long operationId,
                                     @Valid RegisterPaymentRequest request,
                                     @Context ContainerRequestContext requestContext) {
        String username = (String) requestContext.getProperty(
                ExternalApiKeyFilter.EXTERNAL_USER_PROPERTY);
        var payment = liquidationService.registerPayment(operationId, request, username);
        return Response.status(Response.Status.CREATED)
                .entity(PaymentResponse.from(payment))
                .build();
    }
}
