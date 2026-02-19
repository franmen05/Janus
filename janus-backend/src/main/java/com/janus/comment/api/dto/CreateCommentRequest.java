package com.janus.comment.api.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateCommentRequest(
        @NotBlank String content,
        boolean internal
) {}
