package com.janus.user.application;

import com.janus.shared.infrastructure.exception.BusinessException;
import com.janus.shared.infrastructure.exception.NotFoundException;
import com.janus.user.api.dto.CreateUserRequest;
import com.janus.user.domain.model.User;
import com.janus.user.domain.repository.UserRepository;
import io.quarkus.elytron.security.common.BcryptUtil;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.util.List;

@ApplicationScoped
public class UserService {

    @Inject
    UserRepository userRepository;

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
    public User create(CreateUserRequest request) {
        if (userRepository.findByUsername(request.username()).isPresent()) {
            throw new BusinessException("Username already exists: " + request.username());
        }

        var user = new User();
        user.username = request.username();
        user.password = BcryptUtil.bcryptHash(request.password());
        user.fullName = request.fullName();
        user.email = request.email();
        user.role = request.role().name();
        user.clientId = request.clientId();
        userRepository.persist(user);
        return user;
    }
}
