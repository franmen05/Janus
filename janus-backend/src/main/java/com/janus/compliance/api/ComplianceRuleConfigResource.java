package com.janus.compliance.api;

import com.janus.compliance.domain.model.ComplianceRuleConfig;
import com.janus.compliance.domain.repository.ComplianceRuleConfigRepository;
import com.janus.shared.infrastructure.exception.NotFoundException;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
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
    ComplianceRuleConfigRepository repository;

    @GET
    public List<ComplianceRuleConfig> listAll() {
        return repository.listAll();
    }

    @GET
    @Path("/{ruleCode}")
    public List<ComplianceRuleConfig> getByRuleCode(@PathParam("ruleCode") String ruleCode) {
        return repository.findByRuleCode(ruleCode);
    }

    @POST
    @Transactional
    public Response create(ComplianceRuleConfig entity) {
        repository.persist(entity);
        return Response.status(Response.Status.CREATED).entity(entity).build();
    }

    @PUT
    @Path("/{id}")
    @Transactional
    public ComplianceRuleConfig update(@PathParam("id") Long id, ComplianceRuleConfig update) {
        var config = repository.findByIdOptional(id)
                .orElseThrow(() -> new NotFoundException("ComplianceRuleConfig", id));
        config.paramValue = update.paramValue;
        config.enabled = update.enabled;
        if (update.description != null) {
            config.description = update.description;
        }
        return config;
    }

    @DELETE
    @Path("/{id}")
    @Transactional
    public Response delete(@PathParam("id") Long id) {
        var config = repository.findByIdOptional(id)
                .orElseThrow(() -> new NotFoundException("ComplianceRuleConfig", id));
        repository.delete(config);
        return Response.noContent().build();
    }
}
