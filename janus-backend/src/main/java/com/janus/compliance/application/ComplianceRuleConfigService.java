package com.janus.compliance.application;

import com.janus.audit.domain.model.AuditAction;
import com.janus.audit.domain.model.AuditEvent;
import com.janus.compliance.domain.model.ComplianceRuleConfig;
import com.janus.compliance.domain.repository.ComplianceRuleConfigRepository;
import com.janus.shared.infrastructure.exception.NotFoundException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Event;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.util.List;

@ApplicationScoped
public class ComplianceRuleConfigService {

    @Inject
    ComplianceRuleConfigRepository repository;

    @Inject
    Event<AuditEvent> auditEvent;

    public List<ComplianceRuleConfig> listAll() {
        return repository.listAll();
    }

    public List<ComplianceRuleConfig> findByRuleCode(String ruleCode) {
        return repository.findByRuleCode(ruleCode);
    }

    @Transactional
    public ComplianceRuleConfig create(ComplianceRuleConfig entity, String username) {
        repository.persist(entity);
        auditEvent.fire(new AuditEvent(username, AuditAction.CREATE, "ComplianceRuleConfig", entity.id, null, null, null, null));
        return entity;
    }

    @Transactional
    public ComplianceRuleConfig update(Long id, ComplianceRuleConfig update, String username) {
        var config = repository.findByIdOptional(id)
                .orElseThrow(() -> new NotFoundException("ComplianceRuleConfig", id));
        config.paramValue = update.paramValue;
        config.enabled = update.enabled;
        if (update.description != null) {
            config.description = update.description;
        }
        auditEvent.fire(new AuditEvent(username, AuditAction.UPDATE, "ComplianceRuleConfig", config.id, null, null, null, null));
        return config;
    }

    @Transactional
    public void delete(Long id, String username) {
        var config = repository.findByIdOptional(id)
                .orElseThrow(() -> new NotFoundException("ComplianceRuleConfig", id));
        auditEvent.fire(new AuditEvent(username, AuditAction.DELETE, "ComplianceRuleConfig", config.id, null, null, null, null));
        repository.delete(config);
    }
}
