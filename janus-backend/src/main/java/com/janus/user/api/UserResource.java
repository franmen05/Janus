package com.janus.user.api;

import com.janus.user.api.dto.CreateUserRequest;
import com.janus.user.api.dto.UserResponse;
import com.janus.user.application.UserService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.SecurityContext;
import java.util.List;

@Path("/api/users")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class UserResource {

    @Inject
    UserService userService;

    @GET
    @RolesAllowed("ADMIN")
    public List<UserResponse> list() {
        return userService.listAll().stream()
                .map(UserResponse::from)
                .toList();
    }

    @POST
    @RolesAllowed("ADMIN")
    public Response create(@Valid CreateUserRequest request) {
        var user = userService.create(request);
        return Response.status(Response.Status.CREATED)
                .entity(UserResponse.from(user))
                .build();
    }

    @GET
    @Path("/me")
    @RolesAllowed({"ADMIN", "AGENT", "ACCOUNTING", "CLIENT", "CARRIER"})
    public UserResponse me(@Context SecurityContext securityContext) {
        var username = securityContext.getUserPrincipal().getName();
        var user = userService.findByUsername(username);
        return UserResponse.from(user);
    }
}
