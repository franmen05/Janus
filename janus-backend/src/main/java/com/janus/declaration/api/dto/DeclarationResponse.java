package com.janus.declaration.api.dto;

import com.janus.declaration.domain.model.Declaration;
import com.janus.declaration.domain.model.DeclarationType;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record DeclarationResponse(
        Long id,
        Long operationId,
        DeclarationType declarationType,
        String declarationNumber,
        BigDecimal fobValue,
        BigDecimal cifValue,
        BigDecimal taxableBase,
        BigDecimal totalTaxes,
        BigDecimal freightValue,
        BigDecimal insuranceValue,
        String gattMethod,
        String notes,
        LocalDateTime submittedAt,
        LocalDateTime createdAt,
        String technicalApprovedBy,
        LocalDateTime technicalApprovedAt,
        String technicalApprovalComment,
        String finalApprovedBy,
        LocalDateTime finalApprovedAt,
        String finalApprovalComment,
        String rejectedBy,
        LocalDateTime rejectedAt,
        String rejectionComment
) {
    public static DeclarationResponse from(Declaration d) {
        return new DeclarationResponse(
                d.id, d.operation.id, d.declarationType, d.declarationNumber,
                d.fobValue, d.cifValue, d.taxableBase, d.totalTaxes,
                d.freightValue, d.insuranceValue, d.gattMethod, d.notes,
                d.submittedAt, d.createdAt,
                d.technicalApprovedBy, d.technicalApprovedAt, d.technicalApprovalComment,
                d.finalApprovedBy, d.finalApprovedAt, d.finalApprovalComment,
                d.rejectedBy, d.rejectedAt, d.rejectionComment
        );
    }
}
