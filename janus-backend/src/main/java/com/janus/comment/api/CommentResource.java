package com.janus.comment.api;

import com.janus.comment.api.dto.CommentResponse;
import com.janus.comment.api.dto.CreateCommentRequest;
import com.janus.comment.application.CommentService;
import com.janus.operation.application.OperationService;
import com.janus.shared.infrastructure.security.SecurityHelper;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
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
import java.util.List;

@Path("/api/operations/{operationId}/comments")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class CommentResource {

    @Inject
    CommentService commentService;

    @Inject
    OperationService operationService;

    @Inject
    SecurityHelper securityHelper;

    @POST
    @RolesAllowed({"ADMIN", "AGENT"})
    public Response addComment(@PathParam("operationId") Long operationId,
                                @Valid CreateCommentRequest request,
                                @Context SecurityContext sec) {
        var comment = commentService.addComment(operationId, request.content(), sec.getUserPrincipal().getName());
        return Response.status(Response.Status.CREATED)
                .entity(CommentResponse.from(comment))
                .build();
    }

    @GET
    @RolesAllowed({"ADMIN", "AGENT", "ACCOUNTING", "CLIENT"})
    public List<CommentResponse> list(@PathParam("operationId") Long operationId,
                                       @Context SecurityContext sec) {
        securityHelper.enforceClientAccess(sec, operationService.findById(operationId));
        return commentService.getComments(operationId).stream()
                .map(CommentResponse::from)
                .toList();
    }
}
