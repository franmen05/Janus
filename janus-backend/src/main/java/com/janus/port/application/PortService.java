package com.janus.port.application;

import com.janus.port.api.dto.CreatePortRequest;
import com.janus.port.domain.model.Port;
import com.janus.port.domain.repository.PortRepository;
import com.janus.shared.infrastructure.exception.BusinessException;
import com.janus.shared.infrastructure.exception.NotFoundException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.util.List;

@ApplicationScoped
public class PortService {

    @Inject
    PortRepository portRepository;

    public List<Port> listAll() {
        return portRepository.listAll();
    }

    public Port findById(Long id) {
        return portRepository.findByIdOptional(id)
                .orElseThrow(() -> new NotFoundException("Port", id));
    }

    @Transactional
    public Port create(CreatePortRequest request) {
        if (portRepository.findByCode(request.code()).isPresent()) {
            throw new BusinessException("PORT_CODE_ALREADY_EXISTS", "Port with code already exists: " + request.code());
        }

        var port = new Port();
        port.code = request.code();
        port.name = request.name();
        port.description = request.description();
        port.address = request.address();
        portRepository.persist(port);
        return port;
    }

    @Transactional
    public Port update(Long id, CreatePortRequest request) {
        var port = findById(id);

        portRepository.findByCode(request.code()).ifPresent(existing -> {
            if (!existing.id.equals(port.id)) {
                throw new BusinessException("PORT_CODE_ALREADY_EXISTS", "Port with code already exists: " + request.code());
            }
        });

        port.code = request.code();
        port.name = request.name();
        port.description = request.description();
        port.address = request.address();
        return port;
    }
}
