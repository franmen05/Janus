package com.janus.customer.api;

import com.janus.customer.api.dto.CustomerResponse;
import com.janus.customer.api.dto.CreateCustomerRequest;
import com.janus.customer.application.CustomerService;
import com.janus.shared.api.dto.PageResponse;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DefaultValue;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.SecurityContext;

@Path("/api/customers")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RolesAllowed({"ADMIN", "AGENT"})
public class CustomerResource {

    @Inject
    CustomerService customerService;

    @GET
    public PageResponse<CustomerResponse> list(
            @QueryParam("page") @DefaultValue("0") int page,
            @QueryParam("size") @DefaultValue("10") int size,
            @QueryParam("search") String search) {
        return customerService.listPaginated(search, page, size);
    }

    @GET
    @Path("/{id}")
    public CustomerResponse getById(@PathParam("id") Long id) {
        return CustomerResponse.from(customerService.findById(id));
    }

    @POST
    public Response create(@Valid CreateCustomerRequest request, @Context SecurityContext sec) {
        var customer = customerService.create(request, sec.getUserPrincipal().getName());
        return Response.status(Response.Status.CREATED)
                .entity(CustomerResponse.from(customer))
                .build();
    }

    @PUT
    @Path("/{id}")
    public CustomerResponse update(@PathParam("id") Long id, @Valid CreateCustomerRequest request, @Context SecurityContext sec) {
        return CustomerResponse.from(customerService.update(id, request, sec.getUserPrincipal().getName()));
    }
}
