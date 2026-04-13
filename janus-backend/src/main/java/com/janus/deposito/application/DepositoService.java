package com.janus.deposito.application;

import com.janus.audit.domain.model.AuditAction;
import com.janus.audit.domain.model.AuditEvent;
import com.janus.deposito.api.dto.CreateDepositoRequest;
import com.janus.deposito.domain.model.Deposito;
import com.janus.deposito.domain.repository.DepositoRepository;
import com.janus.shared.infrastructure.exception.BusinessException;
import com.janus.shared.infrastructure.exception.NotFoundException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Event;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.util.List;

@ApplicationScoped
public class DepositoService {

    @Inject
    DepositoRepository depositoRepository;

    @Inject
    Event<AuditEvent> auditEvent;

    public List<Deposito> listAll() {
        return depositoRepository.listAll();
    }

    public Deposito findById(Long id) {
        return depositoRepository.findByIdOptional(id)
                .orElseThrow(() -> new NotFoundException("Deposito", id));
    }

    @Transactional
    public Deposito create(CreateDepositoRequest request, String username) {
        if (depositoRepository.findByCode(request.code()).isPresent()) {
            throw new BusinessException("DEPOSITO_CODE_ALREADY_EXISTS", "Deposito with code already exists: " + request.code());
        }

        var deposito = new Deposito();
        deposito.code = request.code();
        deposito.name = request.name();
        deposito.description = request.description();
        depositoRepository.persist(deposito);
        auditEvent.fire(new AuditEvent(username, AuditAction.CREATE, "Deposito", deposito.id, null, null, null, "Deposito created: " + deposito.name));
        return deposito;
    }

    @Transactional
    public Deposito update(Long id, CreateDepositoRequest request, String username) {
        var deposito = findById(id);

        depositoRepository.findByCode(request.code()).ifPresent(existing -> {
            if (!existing.id.equals(deposito.id)) {
                throw new BusinessException("DEPOSITO_CODE_ALREADY_EXISTS", "Deposito with code already exists: " + request.code());
            }
        });

        deposito.code = request.code();
        deposito.name = request.name();
        deposito.description = request.description();
        auditEvent.fire(new AuditEvent(username, AuditAction.UPDATE, "Deposito", deposito.id, null, null, null, "Deposito updated: " + deposito.name));
        return deposito;
    }
}
