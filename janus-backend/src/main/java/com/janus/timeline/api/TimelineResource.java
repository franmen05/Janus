package com.janus.timeline.api;

import com.janus.operation.application.OperationService;
import com.janus.shared.infrastructure.security.SecurityHelper;
import com.janus.timeline.api.dto.TimelineEventResponse;
import com.janus.timeline.api.dto.TimelineEventType;
import com.janus.timeline.application.TimelineService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.SecurityContext;
import java.util.List;

@Path("/api/operations/{operationId}/timeline")
@Produces(MediaType.APPLICATION_JSON)
public class TimelineResource {

    @Inject
    TimelineService timelineService;

    @Inject
    OperationService operationService;

    @Inject
    SecurityHelper securityHelper;

    @GET
    @RolesAllowed({"ADMIN", "AGENT", "ACCOUNTING", "CLIENT"})
    public List<TimelineEventResponse> getTimeline(
            @PathParam("operationId") Long operationId,
            @QueryParam("type") TimelineEventType type,
            @Context SecurityContext sec) {
        securityHelper.enforceClientAccess(sec, operationService.findById(operationId));
        return timelineService.getTimeline(operationId, type);
    }
}
