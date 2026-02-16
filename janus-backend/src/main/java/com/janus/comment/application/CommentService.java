package com.janus.comment.application;

import com.janus.audit.domain.model.AuditAction;
import com.janus.audit.domain.model.AuditEvent;
import com.janus.comment.domain.model.OperationComment;
import com.janus.comment.domain.repository.OperationCommentRepository;
import com.janus.operation.application.OperationService;
import com.janus.shared.infrastructure.exception.NotFoundException;
import com.janus.user.domain.repository.UserRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Event;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.util.List;

@ApplicationScoped
public class CommentService {

    @Inject
    OperationCommentRepository commentRepository;

    @Inject
    OperationService operationService;

    @Inject
    UserRepository userRepository;

    @Inject
    Event<AuditEvent> auditEvent;

    @Transactional
    public OperationComment addComment(Long operationId, String content, String username) {
        var operation = operationService.findById(operationId);
        var user = userRepository.findByUsername(username)
                .orElseThrow(() -> new NotFoundException("User", username));

        var comment = new OperationComment();
        comment.operation = operation;
        comment.author = user;
        comment.content = content;
        commentRepository.persist(comment);

        auditEvent.fire(new AuditEvent(
                username, AuditAction.COMMENT_ADDED, "OperationComment", comment.id, operationId,
                null, null, "Comment added to operation " + operation.referenceNumber
        ));

        return comment;
    }

    public List<OperationComment> getComments(Long operationId) {
        operationService.findById(operationId);
        return commentRepository.findByOperationId(operationId);
    }
}
