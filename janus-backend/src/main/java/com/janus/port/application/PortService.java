package com.janus.port.application;

import com.janus.audit.domain.model.AuditAction;
import com.janus.audit.domain.model.AuditEvent;
import com.janus.port.api.dto.BulkImportPortsRequest;
import com.janus.port.api.dto.BulkImportPortsResponse;
import com.janus.port.api.dto.CreatePortRequest;
import com.janus.port.domain.model.Port;
import com.janus.port.domain.repository.PortRepository;
import com.janus.shared.infrastructure.exception.BusinessException;
import com.janus.shared.infrastructure.exception.NotFoundException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Event;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.util.List;
import java.util.Set;

@ApplicationScoped
public class PortService {

    @Inject
    PortRepository portRepository;

    @Inject
    Event<AuditEvent> auditEvent;

    public List<Port> listAll() {
        return portRepository.listAll();
    }

    public Port findById(Long id) {
        return portRepository.findByIdOptional(id)
                .orElseThrow(() -> new NotFoundException("Port", id));
    }

    @Transactional
    public Port create(CreatePortRequest request, String username) {
        if (portRepository.findByCode(request.code()).isPresent()) {
            throw new BusinessException("PORT_CODE_ALREADY_EXISTS", "Port with code already exists: " + request.code());
        }

        var port = new Port();
        port.code = request.code();
        port.name = request.name();
        port.description = request.description();
        port.address = request.address();
        port.country = request.country();
        portRepository.persist(port);
        auditEvent.fire(new AuditEvent(username, AuditAction.CREATE, "Port", port.id, null, null, null, "Port created: " + port.name));
        return port;
    }

    @Transactional
    public Port update(Long id, CreatePortRequest request, String username) {
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
        port.country = request.country();
        auditEvent.fire(new AuditEvent(username, AuditAction.UPDATE, "Port", port.id, null, null, null, "Port updated: " + port.name));
        return port;
    }

    @Transactional
    public BulkImportPortsResponse bulkImport(BulkImportPortsRequest request, String username) {
        var codes = request.ports().stream().map(BulkImportPortsRequest.PortEntry::code).toList();
        var existingCodes = Set.copyOf(portRepository.findExistingCodes(codes));

        int imported = 0;
        int skipped = 0;

        for (var entry : request.ports()) {
            if (existingCodes.contains(entry.code())) {
                skipped++;
            } else {
                var port = new Port();
                port.code = entry.code();
                port.name = entry.name();
                port.description = entry.description();
                port.country = request.country();
                portRepository.persist(port);
                imported++;
            }
        }

        auditEvent.fire(new AuditEvent(username, AuditAction.CREATE, "Port", null, null, null, null,
                "Bulk imported " + imported + " ports for country " + request.country()));

        return new BulkImportPortsResponse(imported, skipped);
    }
}
