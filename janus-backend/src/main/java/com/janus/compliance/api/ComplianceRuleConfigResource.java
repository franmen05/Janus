package com.janus.compliance.api;

import com.janus.compliance.application.ComplianceRuleConfigService;
import com.janus.compliance.domain.model.ComplianceRuleConfig;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;

@Path("/api/compliance/config")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RolesAllowed("ADMIN")
public class ComplianceRuleConfigResource {

    @Inject
    ComplianceRuleConfigService service;

    @GET
    public List<ComplianceRuleConfig> listAll() {
        return service.listAll();
    }

    @GET
    @Path("/{ruleCode}")
    public List<ComplianceRuleConfig> getByRuleCode(@PathParam("ruleCode") String ruleCode) {
        return service.findByRuleCode(ruleCode);
    }

    @POST
    public Response create(ComplianceRuleConfig entity) {
        var created = service.create(entity);
        return Response.status(Response.Status.CREATED).entity(created).build();
    }

    @PUT
    @Path("/{id}")
    public ComplianceRuleConfig update(@PathParam("id") Long id, ComplianceRuleConfig update) {
        return service.update(id, update);
    }

    @DELETE
    @Path("/{id}")
    public Response delete(@PathParam("id") Long id) {
        service.delete(id);
        return Response.noContent().build();
    }
}
