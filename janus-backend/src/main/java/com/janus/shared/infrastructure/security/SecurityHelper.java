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
     * Returns the accountId for a CUSTOMER user, or null for non-CUSTOMER roles.
     */
    public Long getAccountIdFilter(SecurityContext sec) {
        var user = getUser(sec);
        if (user.hasRole("CUSTOMER")) {
            return user.accountId;
        }
        return null;
    }

    /**
     * Throws ForbiddenException if a CUSTOMER user tries to access an operation
     * that doesn't belong to their account.
     */
    public void enforceCustomerAccess(SecurityContext sec, Operation operation) {
        var user = getUser(sec);
        if (user.hasRole("CUSTOMER")) {
            if (user.accountId == null || operation.account == null
                    || !user.accountId.equals(operation.account.id)) {
                throw new ForbiddenException("Access denied: operation does not belong to your account");
            }
        }
    }

    /**
     * Returns true if the current user has the CUSTOMER role.
     */
    public boolean isCustomer(SecurityContext sec) {
        return sec.isUserInRole("CUSTOMER");
    }

    private User getUser(SecurityContext sec) {
        var username = sec.getUserPrincipal().getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException("User not found: " + username));
    }
}
