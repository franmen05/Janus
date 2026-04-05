package com.janus.user.application;

import com.janus.audit.domain.model.AuditAction;
import com.janus.audit.domain.model.AuditEvent;
import com.janus.shared.infrastructure.exception.BusinessException;
import com.janus.shared.infrastructure.exception.NotFoundException;
import com.janus.user.api.dto.CreateUserRequest;
import com.janus.user.api.dto.UpdateUserRequest;
import com.janus.user.domain.model.Role;
import com.janus.user.domain.model.User;
import com.janus.user.domain.repository.UserRepository;
import io.quarkus.elytron.security.common.BcryptUtil;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Event;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@ApplicationScoped
public class UserService {

    @Inject
    UserRepository userRepository;

    @Inject
    Event<AuditEvent> auditEvent;

    public List<User> listAll() {
        return userRepository.listAll();
    }

    public User findById(Long id) {
        return userRepository.findByIdOptional(id)
                .orElseThrow(() -> new NotFoundException("User", id));
    }

    public User findByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new NotFoundException("User", username));
    }

    @Transactional
    public User create(CreateUserRequest request, String username) {
        if (userRepository.findByUsername(request.username()).isPresent()) {
            throw new BusinessException("Username already exists: " + request.username());
        }

        var user = new User();
        user.username = request.username();
        user.password = BcryptUtil.bcryptHash(request.password());
        user.fullName = request.fullName();
        user.email = request.email();
        user.roles = request.roles().stream().map(Role::name).collect(Collectors.toSet());
        user.customerId = request.customerId();
        userRepository.persist(user);
        auditEvent.fire(new AuditEvent(username, AuditAction.CREATE, "User", user.id, null, null, null,
                "User created: " + user.username));
        return user;
    }

    @Transactional
    public User update(Long id, UpdateUserRequest request, String username) {
        var user = findById(id);
        user.fullName = request.fullName();
        user.email = request.email();
        user.roles = request.roles().stream().map(Role::name).collect(Collectors.toSet());
        user.customerId = request.customerId();
        user.active = request.active();
        if (request.password() != null && !request.password().isBlank()) {
            user.password = BcryptUtil.bcryptHash(request.password());
        }
        auditEvent.fire(new AuditEvent(username, AuditAction.UPDATE, "User", user.id, null, null, null,
                "User updated: " + user.username));
        return user;
    }

    @Transactional
    public User toggleActive(Long id, String username) {
        var user = findById(id);
        user.active = !user.active;
        var status = user.active ? "active" : "inactive";
        auditEvent.fire(new AuditEvent(username, AuditAction.UPDATE, "User", user.id, null, null, null,
                "User toggled to " + status + ": " + user.username));
        return user;
    }
}
