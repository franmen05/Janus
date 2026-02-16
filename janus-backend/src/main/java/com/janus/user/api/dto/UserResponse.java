package com.janus.user.api.dto;

import com.janus.user.domain.model.User;
import java.time.LocalDateTime;

public record UserResponse(
        Long id,
        String username,
        String fullName,
        String email,
        String role,
        boolean active,
        Long clientId,
        LocalDateTime createdAt
) {
    public static UserResponse from(User user) {
        return new UserResponse(
                user.id,
                user.username,
                user.fullName,
                user.email,
                user.role,
                user.active,
                user.clientId,
                user.createdAt
        );
    }
}
