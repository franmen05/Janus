package com.janus.payment.application;

import com.janus.declaration.domain.model.Declaration;
import com.janus.declaration.domain.model.DeclarationType;
import com.janus.declaration.domain.model.TariffLine;
import com.janus.declaration.domain.service.PreliquidationService;
import com.janus.inspection.domain.model.InspectionExpense;
import com.janus.operation.application.OperationService;
import com.janus.payment.api.dto.RegisterPaymentRequest;
import com.janus.payment.domain.model.Liquidation;
import com.janus.payment.domain.model.LiquidationLine;
import com.janus.payment.domain.model.LiquidationStatus;
import com.janus.payment.domain.model.Payment;
import com.janus.audit.domain.model.AuditAction;
import com.janus.audit.domain.model.AuditEvent;
import com.janus.shared.infrastructure.exception.BusinessException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Event;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import org.jboss.logging.Logger;

@ApplicationScoped
public class LiquidationService {

    private static final Logger LOG = Logger.getLogger(LiquidationService.class);

    @Inject
    OperationService operationService;

    @Inject
    PreliquidationService preliquidationService;

    @Inject
    Event<AuditEvent> auditEvent;

    @Transactional
    public Liquidation generateLiquidation(Long operationId, BigDecimal agencyServiceFee, String username) {
        var operation = operationService.findById(operationId);

        // Find the FINAL declaration
        Declaration finalDeclaration = Declaration.find(
                "operation.id = ?1 and declarationType = ?2", operationId, DeclarationType.FINAL
        ).firstResult();

        if (finalDeclaration == null) {
            throw new BusinessException("LIQUIDATION_NO_FINAL_DECLARATION",
                    "No FINAL declaration found for this operation");
        }

        // Check for existing liquidation
        Liquidation existing = Liquidation.find("operation.id = ?1", operationId).firstResult();
        if (existing != null) {
            if (existing.status != LiquidationStatus.PRELIMINARY) {
                throw new BusinessException("LIQUIDATION_ALREADY_APPROVED",
                        "Cannot regenerate a liquidation that is no longer PRELIMINARY");
            }
            existing.delete();
        }

        // Calculate taxes from the declaration
        List<TariffLine> tariffLines = TariffLine.list("declaration.id = ?1", finalDeclaration.id);
        var preliqResult = preliquidationService.calculate(finalDeclaration, tariffLines);

        // Fetch reimbursable inspection expenses
        List<InspectionExpense> expenses = InspectionExpense.list(
                "operation.id = ?1 and active = true", operationId);

        // Build the liquidation
        var liquidation = new Liquidation();
        liquidation.operation = operation;
        liquidation.declaration = finalDeclaration;
        liquidation.status = LiquidationStatus.PRELIMINARY;

        int lineOrder = 1;

        // Add customs tax line
        var taxLine = new LiquidationLine();
        taxLine.liquidation = liquidation;
        taxLine.concept = "CUSTOMS_TAXES";
        taxLine.description = "Total customs taxes (duty, ITBIS, selective, surcharge, admin fees)";
        taxLine.baseAmount = preliqResult.taxableBase();
        taxLine.amount = preliqResult.totalTaxes();
        taxLine.lineOrder = lineOrder++;
        taxLine.reimbursable = false;
        liquidation.lines.add(taxLine);

        var totalCustomsTaxes = preliqResult.totalTaxes();

        // Add third-party expense lines
        var totalThirdParty = BigDecimal.ZERO;
        for (var expense : expenses) {
            if (expense.reimbursable) {
                var expenseLine = new LiquidationLine();
                expenseLine.liquidation = liquidation;
                expenseLine.concept = expense.category != null ? expense.category : "OTHER";
                expenseLine.description = expense.description;
                expenseLine.amount = expense.amount;
                expenseLine.lineOrder = lineOrder++;
                expenseLine.reimbursable = true;
                liquidation.lines.add(expenseLine);
                totalThirdParty = totalThirdParty.add(expense.amount);
            }
        }

        // Add agency service fee line if provided
        var totalAgencyServices = BigDecimal.ZERO;
        if (agencyServiceFee != null && agencyServiceFee.compareTo(BigDecimal.ZERO) > 0) {
            var agencyLine = new LiquidationLine();
            agencyLine.liquidation = liquidation;
            agencyLine.concept = "AGENCY_SERVICE";
            agencyLine.description = "Agency service fee";
            agencyLine.amount = agencyServiceFee;
            agencyLine.lineOrder = lineOrder++;
            agencyLine.reimbursable = false;
            liquidation.lines.add(agencyLine);
            totalAgencyServices = agencyServiceFee;
        }

        liquidation.totalCustomsTaxes = totalCustomsTaxes;
        liquidation.totalThirdParty = totalThirdParty;
        liquidation.totalAgencyServices = totalAgencyServices;
        liquidation.grandTotal = totalCustomsTaxes.add(totalThirdParty).add(totalAgencyServices);

        liquidation.persist();

        LOG.infof("Liquidation generated for operation %d by %s, grand total: %s",
                operationId, username, liquidation.grandTotal);

        auditEvent.fire(new AuditEvent(
                username, AuditAction.CREATE, "Liquidation", liquidation.id, operationId,
                null, null, "Liquidation generated with grand total: " + liquidation.grandTotal
        ));

        return liquidation;
    }

    @Transactional
    public Liquidation approveLiquidation(Long operationId, String comment, String username) {
        Liquidation liquidation = Liquidation.find("operation.id = ?1", operationId).firstResult();

        if (liquidation == null) {
            throw new BusinessException("LIQUIDATION_NOT_FOUND",
                    "No liquidation found for this operation");
        }

        if (liquidation.status != LiquidationStatus.PRELIMINARY) {
            throw new BusinessException("LIQUIDATION_NOT_PRELIMINARY",
                    "Only PRELIMINARY liquidations can be approved");
        }

        liquidation.status = LiquidationStatus.APPROVED;
        liquidation.approvedBy = username;
        liquidation.approvedAt = LocalDateTime.now();
        liquidation.approvalComment = comment;

        LOG.infof("Liquidation approved for operation %d by %s", operationId, username);

        auditEvent.fire(new AuditEvent(
                username, AuditAction.APPROVAL, "Liquidation", liquidation.id, operationId,
                null, null, "Liquidation approved" + (comment != null ? ": " + comment : "")
        ));

        return liquidation;
    }

    @Transactional
    public Liquidation makeLiquidationDefinitive(Long operationId, String dgaPaymentCode, String username) {
        Liquidation liquidation = Liquidation.find("operation.id = ?1", operationId).firstResult();

        if (liquidation == null) {
            throw new BusinessException("LIQUIDATION_NOT_FOUND",
                    "No liquidation found for this operation");
        }

        if (liquidation.status != LiquidationStatus.APPROVED) {
            throw new BusinessException("LIQUIDATION_NOT_APPROVED",
                    "Only APPROVED liquidations can be made definitive");
        }

        liquidation.status = LiquidationStatus.DEFINITIVE;
        liquidation.dgaPaymentCode = dgaPaymentCode;

        LOG.infof("Liquidation made definitive for operation %d by %s, DGA code: %s",
                operationId, username, dgaPaymentCode);

        auditEvent.fire(new AuditEvent(
                username, AuditAction.STATUS_CHANGE, "Liquidation", liquidation.id, operationId,
                null, null, "Liquidation made definitive, DGA code: " + dgaPaymentCode
        ));

        return liquidation;
    }

    @Transactional
    public Payment registerPayment(Long operationId, RegisterPaymentRequest request, String username) {
        Liquidation liquidation = Liquidation.find("operation.id = ?1", operationId).firstResult();

        if (liquidation == null) {
            throw new BusinessException("LIQUIDATION_NOT_FOUND",
                    "No liquidation found for this operation");
        }

        if (liquidation.status != LiquidationStatus.DEFINITIVE) {
            throw new BusinessException("LIQUIDATION_NOT_DEFINITIVE",
                    "Payment can only be registered for DEFINITIVE liquidations");
        }

        var operation = operationService.findById(operationId);

        var payment = new Payment();
        payment.operation = operation;
        payment.liquidation = liquidation;
        payment.amount = request.amount();
        payment.paymentMethod = request.paymentMethod();
        payment.paymentDate = request.paymentDate();
        payment.dgaReference = request.dgaReference();
        payment.bankReference = request.bankReference();
        payment.notes = request.notes();
        payment.registeredBy = username;

        payment.persist();

        liquidation.status = LiquidationStatus.PAID;

        LOG.infof("Payment registered for operation %d by %s, amount: %s",
                operationId, username, request.amount());

        auditEvent.fire(new AuditEvent(
                username, AuditAction.CREATE, "Payment", payment.id, operationId,
                null, null, "Payment registered, amount: " + request.amount()
        ));

        return payment;
    }

    public Liquidation getLiquidation(Long operationId) {
        return Liquidation.find("operation.id = ?1", operationId).firstResult();
    }

    public Payment getPayment(Long operationId) {
        return Payment.find("operation.id = ?1", operationId).firstResult();
    }
}
