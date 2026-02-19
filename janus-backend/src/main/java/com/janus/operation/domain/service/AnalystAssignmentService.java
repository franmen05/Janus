package com.janus.operation.domain.service;

import com.janus.operation.domain.model.OperationStatus;
import com.janus.operation.domain.repository.OperationRepository;
import com.janus.user.domain.model.User;
import com.janus.user.domain.repository.UserRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.util.Comparator;
import java.util.Optional;

@ApplicationScoped
public class AnalystAssignmentService {

    private static final java.util.Set<OperationStatus> FINAL_STATUSES = java.util.Set.of(
            OperationStatus.CLOSED, OperationStatus.CANCELLED
    );

    @Inject
    UserRepository userRepository;

    @Inject
    OperationRepository operationRepository;

    /**
     * Finds the least-loaded active agent (user with role AGENT).
     * "Least-loaded" = fewest non-final operations assigned.
     */
    public Optional<User> findLeastLoadedAgent() {
        var agents = userRepository.list("role = ?1 AND active = true", "AGENT");
        if (agents.isEmpty()) {
            return Optional.empty();
        }

        return agents.stream()
                .min(Comparator.comparingLong(this::countActiveOperations));
    }

    private long countActiveOperations(User agent) {
        return operationRepository.count(
                "assignedAgent.id = ?1 AND status NOT IN (?2, ?3)",
                agent.id, OperationStatus.CLOSED, OperationStatus.CANCELLED
        );
    }
}
