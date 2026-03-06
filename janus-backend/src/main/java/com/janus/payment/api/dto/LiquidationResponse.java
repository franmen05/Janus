package com.janus.payment.api.dto;

import com.janus.payment.domain.model.Liquidation;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record LiquidationResponse(
        Long id,
        Long operationId,
        Long declarationId,
        String status,
        BigDecimal totalCustomsTaxes,
        BigDecimal totalThirdParty,
        BigDecimal totalAgencyServices,
        BigDecimal grandTotal,
        String dgaPaymentCode,
        String approvedBy,
        LocalDateTime approvedAt,
        String approvalComment,
        List<LiquidationLineResponse> lines,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static LiquidationResponse from(Liquidation l) {
        return new LiquidationResponse(
                l.id,
                l.operation != null ? l.operation.id : null,
                l.declaration != null ? l.declaration.id : null,
                l.status != null ? l.status.name() : null,
                l.totalCustomsTaxes,
                l.totalThirdParty,
                l.totalAgencyServices,
                l.grandTotal,
                l.dgaPaymentCode,
                l.approvedBy,
                l.approvedAt,
                l.approvalComment,
                l.lines != null ? l.lines.stream()
                        .map(LiquidationLineResponse::from)
                        .toList() : List.of(),
                l.createdAt,
                l.updatedAt
        );
    }
}
