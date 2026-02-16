package com.janus.declaration.application;

import com.janus.audit.domain.model.AuditAction;
import com.janus.audit.domain.model.AuditEvent;
import com.janus.declaration.domain.model.CrossingDiscrepancy;
import com.janus.declaration.domain.model.CrossingResult;
import com.janus.declaration.domain.model.CrossingStatus;
import com.janus.declaration.domain.model.Declaration;
import com.janus.declaration.domain.model.DeclarationType;
import com.janus.declaration.domain.model.TariffLine;
import com.janus.declaration.domain.repository.CrossingDiscrepancyRepository;
import com.janus.declaration.domain.repository.CrossingResultRepository;
import com.janus.declaration.domain.repository.DeclarationRepository;
import com.janus.declaration.domain.repository.TariffLineRepository;
import com.janus.declaration.domain.service.CrossingEngine;
import com.janus.notification.application.NotificationService;
import com.janus.operation.application.OperationService;
import com.janus.shared.infrastructure.exception.BusinessException;
import com.janus.shared.infrastructure.exception.NotFoundException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Event;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@ApplicationScoped
public class DeclarationService {

    @Inject
    DeclarationRepository declarationRepository;

    @Inject
    TariffLineRepository tariffLineRepository;

    @Inject
    CrossingResultRepository crossingResultRepository;

    @Inject
    CrossingDiscrepancyRepository crossingDiscrepancyRepository;

    @Inject
    CrossingEngine crossingEngine;

    @Inject
    OperationService operationService;

    @Inject
    NotificationService notificationService;

    @Inject
    Event<AuditEvent> auditEvent;

    @Transactional
    public Declaration registerPreliminary(Long operationId, Declaration declaration, String username) {
        return registerDeclaration(operationId, declaration, DeclarationType.PRELIMINARY, username);
    }

    @Transactional
    public Declaration registerFinal(Long operationId, Declaration declaration, String username) {
        return registerDeclaration(operationId, declaration, DeclarationType.FINAL, username);
    }

    private Declaration registerDeclaration(Long operationId, Declaration declaration,
                                             DeclarationType type, String username) {
        var operation = operationService.findById(operationId);

        if (declarationRepository.findByOperationAndType(operationId, type).isPresent()) {
            throw new BusinessException(type + " declaration already exists for this operation");
        }

        declaration.operation = operation;
        declaration.declarationType = type;
        declaration.submittedAt = LocalDateTime.now();
        declarationRepository.persist(declaration);

        auditEvent.fire(new AuditEvent(
                username, AuditAction.CREATE, "Declaration", declaration.id, operationId,
                null, null, type + " declaration registered: " + declaration.declarationNumber
        ));

        return declaration;
    }

    public List<Declaration> findByOperationId(Long operationId) {
        operationService.findById(operationId);
        return declarationRepository.findByOperationId(operationId);
    }

    public Declaration findById(Long operationId, Long declarationId) {
        operationService.findById(operationId);
        var decl = declarationRepository.findByIdOptional(declarationId)
                .orElseThrow(() -> new NotFoundException("Declaration", declarationId));
        if (!decl.operation.id.equals(operationId)) {
            throw new NotFoundException("Declaration", declarationId);
        }
        return decl;
    }

    @Transactional
    public TariffLine addTariffLine(Long operationId, Long declarationId, TariffLine line, String username) {
        var declaration = findById(operationId, declarationId);
        line.declaration = declaration;
        tariffLineRepository.persist(line);

        auditEvent.fire(new AuditEvent(
                username, AuditAction.CREATE, "TariffLine", line.id, operationId,
                null, null, "Tariff line " + line.lineNumber + " added to declaration " + declarationId
        ));

        return line;
    }

    public List<TariffLine> getTariffLines(Long operationId, Long declarationId) {
        findById(operationId, declarationId);
        return tariffLineRepository.findByDeclarationId(declarationId);
    }

    @Transactional
    public CrossingResult executeCrossing(Long operationId, String username) {
        var operation = operationService.findById(operationId);

        var preliminary = declarationRepository.findByOperationAndType(operationId, DeclarationType.PRELIMINARY)
                .orElseThrow(() -> new BusinessException("Preliminary declaration not found"));
        var finalDecl = declarationRepository.findByOperationAndType(operationId, DeclarationType.FINAL)
                .orElseThrow(() -> new BusinessException("Final declaration not found"));

        var prelimLines = tariffLineRepository.findByDeclarationId(preliminary.id);
        var finalLines = tariffLineRepository.findByDeclarationId(finalDecl.id);

        var crossingResult = new CrossingResult();
        crossingResult.operation = operation;
        crossingResult.preliminaryDeclaration = preliminary;
        crossingResult.finalDeclaration = finalDecl;
        crossingResultRepository.persist(crossingResult);

        var discrepancies = crossingEngine.compare(crossingResult, preliminary, prelimLines, finalDecl, finalLines);

        for (var d : discrepancies) {
            crossingDiscrepancyRepository.persist(d);
        }

        if (discrepancies.isEmpty()) {
            crossingResult.status = CrossingStatus.MATCH;
        } else {
            crossingResult.status = CrossingStatus.DISCREPANCY;
            notificationService.send(
                    operationId, operation.client.email,
                    "Crossing Discrepancy Detected - " + operation.referenceNumber,
                    "Discrepancies were found between preliminary and final declarations for operation "
                            + operation.referenceNumber + ". Please review."
            );
        }

        auditEvent.fire(new AuditEvent(
                username, AuditAction.CREATE, "CrossingResult", crossingResult.id, operationId,
                null, null, "Crossing executed: " + crossingResult.status
                        + " (" + discrepancies.size() + " discrepancies)"
        ));

        return crossingResult;
    }

    @Transactional
    public CrossingResult resolveCrossing(Long operationId, String comment, String username) {
        var crossingResult = crossingResultRepository.findByOperationId(operationId)
                .orElseThrow(() -> new NotFoundException("CrossingResult for operation", operationId));

        if (crossingResult.status != CrossingStatus.DISCREPANCY) {
            throw new BusinessException("Crossing is not in DISCREPANCY status");
        }

        crossingResult.status = CrossingStatus.RESOLVED;
        crossingResult.resolvedBy = username;
        crossingResult.resolutionComment = comment;
        crossingResult.resolvedAt = LocalDateTime.now();

        auditEvent.fire(new AuditEvent(
                username, AuditAction.UPDATE, "CrossingResult", crossingResult.id, operationId,
                null, null, "Crossing resolved by " + username
        ));

        return crossingResult;
    }

    public CrossingResult getCrossingResult(Long operationId) {
        operationService.findById(operationId);
        return crossingResultRepository.findByOperationId(operationId).orElse(null);
    }

    public List<CrossingDiscrepancy> getDiscrepancies(Long crossingResultId) {
        return crossingDiscrepancyRepository.findByCrossingResultId(crossingResultId);
    }
}
