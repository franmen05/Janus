package com.janus.customer.api;

import com.janus.customer.api.dto.CreateCustomerContactRequest;
import com.janus.customer.api.dto.CustomerContactResponse;
import com.janus.customer.application.CustomerContactService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
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

@Path("/api/customers/{customerId}/contacts")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RolesAllowed({"ADMIN", "AGENT"})
public class CustomerContactResource {

    @Inject
    CustomerContactService customerContactService;

    @GET
    public List<CustomerContactResponse> list(@PathParam("customerId") Long customerId) {
        return customerContactService.listByCustomerId(customerId).stream()
                .map(CustomerContactResponse::from)
                .toList();
    }

    @POST
    public Response create(@PathParam("customerId") Long customerId,
                           @Valid CreateCustomerContactRequest request,
                           @Context SecurityContext sec) {
        var contact = customerContactService.create(customerId, request, sec.getUserPrincipal().getName());
        return Response.status(Response.Status.CREATED)
                .entity(CustomerContactResponse.from(contact))
                .build();
    }

    @PUT
    @Path("/{contactId}")
    public CustomerContactResponse update(@PathParam("customerId") Long customerId,
                                          @PathParam("contactId") Long contactId,
                                          @Valid CreateCustomerContactRequest request,
                                          @Context SecurityContext sec) {
        return CustomerContactResponse.from(
                customerContactService.update(contactId, request, sec.getUserPrincipal().getName()));
    }

    @DELETE
    @Path("/{contactId}")
    public Response delete(@PathParam("customerId") Long customerId,
                           @PathParam("contactId") Long contactId,
                           @Context SecurityContext sec) {
        customerContactService.delete(contactId, sec.getUserPrincipal().getName());
        return Response.noContent().build();
    }
}
