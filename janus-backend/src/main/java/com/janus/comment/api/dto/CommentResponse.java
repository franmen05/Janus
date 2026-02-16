package com.janus.comment.api.dto;

import com.janus.comment.domain.model.OperationComment;
import java.time.LocalDateTime;

public record CommentResponse(
        Long id,
        Long operationId,
        String authorUsername,
        String authorFullName,
        String content,
        LocalDateTime createdAt
) {
    public static CommentResponse from(OperationComment comment) {
        return new CommentResponse(
                comment.id,
                comment.operation.id,
                comment.author != null ? comment.author.username : null,
                comment.author != null ? comment.author.fullName : null,
                comment.content,
                comment.createdAt
        );
    }
}
