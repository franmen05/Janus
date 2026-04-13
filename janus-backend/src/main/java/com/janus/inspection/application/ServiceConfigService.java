package com.janus.inspection.application;

import com.janus.audit.domain.model.AuditAction;
import com.janus.audit.domain.model.AuditEvent;
import com.janus.inspection.api.dto.CreateServiceRequest;
import com.janus.inspection.api.dto.UpdateServiceRequest;
import com.janus.inspection.domain.model.ServiceConfig;
import com.janus.inspection.domain.repository.ServiceConfigRepository;
import com.janus.inspection.domain.repository.InspectionExpenseRepository;
import com.janus.inspection.domain.model.ServiceModule;
import com.janus.shared.infrastructure.exception.BusinessException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Event;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.util.EnumSet;
import java.util.List;

@ApplicationScoped
public class ServiceConfigService {

    @Inject
    ServiceConfigRepository repository;

    @Inject
    InspectionExpenseRepository expenseRepository;

    @Inject
    Event<AuditEvent> auditEvent;

    public List<ServiceConfig> listAll() {
        return repository.findAllOrdered();
    }

    public List<ServiceConfig> listActive() {
        return repository.findActive();
    }

    @Transactional
    public ServiceConfig create(CreateServiceRequest request, String username) {
        var name = request.name().toUpperCase().trim();

        if (repository.findByName(name).isPresent()) {
            throw new BusinessException("SERVICE_ALREADY_EXISTS",
                    "Service with name '" + name + "' already exists");
        }

        var config = new ServiceConfig();
        config.name = name;
        config.labelEs = request.labelEs();
        config.labelEn = request.labelEn();
        config.appliesTo = request.appliesTo() != null ? request.appliesTo() : EnumSet.allOf(ServiceModule.class);
        repository.persist(config);

        auditEvent.fire(new AuditEvent(username, AuditAction.CREATE, "ServiceConfig",
                config.id, null, null, null, null));

        return config;
    }

    @Transactional
    public ServiceConfig update(Long id, UpdateServiceRequest request, String username) {
        var config = repository.findByIdOptional(id)
                .orElseThrow(() -> new jakarta.ws.rs.NotFoundException("Service not found"));

        config.labelEs = request.labelEs();
        config.labelEn = request.labelEn();
        config.sortOrder = request.sortOrder();
        if (request.appliesTo() != null) {
            config.appliesTo = request.appliesTo();
        }

        auditEvent.fire(new AuditEvent(username, AuditAction.UPDATE, "ServiceConfig",
                config.id, null, null, null, null));

        return config;
    }

    @Transactional
    public ServiceConfig toggleActive(Long id, String username) {
        var config = repository.findByIdOptional(id)
                .orElseThrow(() -> new jakarta.ws.rs.NotFoundException("Service not found"));

        config.active = !config.active;

        auditEvent.fire(new AuditEvent(username, AuditAction.UPDATE, "ServiceConfig",
                config.id, null, null, null,
                "Toggled active to " + config.active));

        return config;
    }

    @Transactional
    public void delete(Long id, String username) {
        var config = repository.findByIdOptional(id)
                .orElseThrow(() -> new jakarta.ws.rs.NotFoundException("Service not found"));

        long usageCount = expenseRepository.count("category = ?1 and active = true", config.name);
        if (usageCount > 0) {
            throw new BusinessException("SERVICE_IN_USE",
                    "Cannot delete service '" + config.name + "' because it is referenced by " + usageCount + " expense(s)");
        }

        var entityId = config.id;
        repository.delete(config);

        auditEvent.fire(new AuditEvent(username, AuditAction.DELETE, "ServiceConfig",
                entityId, null, null, null, null));
    }
}
