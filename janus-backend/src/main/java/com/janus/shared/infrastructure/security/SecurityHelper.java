package com.janus.shared.infrastructure.security;

import com.janus.operation.domain.model.Operation;
import com.janus.shared.infrastructure.exception.BusinessException;
import com.janus.user.domain.model.User;
import com.janus.user.domain.repository.UserRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.ForbiddenException;
import jakarta.ws.rs.core.SecurityContext;

@ApplicationScoped
public class SecurityHelper {

    @Inject
    UserRepository userRepository;

    /**
     * Returns the clientId for a CLIENT user, or null for non-CLIENT roles.
     */
    public Long getClientIdFilter(SecurityContext sec) {
        var user = getUser(sec);
        if ("CLIENT".equals(user.role)) {
            return user.clientId;
        }
        return null;
    }

    /**
     * Throws ForbiddenException if a CLIENT user tries to access an operation
     * that doesn't belong to their client.
     */
    public void enforceClientAccess(SecurityContext sec, Operation operation) {
        var user = getUser(sec);
        if ("CLIENT".equals(user.role)) {
            if (user.clientId == null || operation.client == null
                    || !user.clientId.equals(operation.client.id)) {
                throw new ForbiddenException("Access denied: operation does not belong to your client");
            }
        }
    }

    /**
     * Returns true if the current user has the CLIENT role.
     */
    public boolean isClient(SecurityContext sec) {
        return sec.isUserInRole("CLIENT");
    }

    private User getUser(SecurityContext sec) {
        var username = sec.getUserPrincipal().getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException("User not found: " + username));
    }
}
