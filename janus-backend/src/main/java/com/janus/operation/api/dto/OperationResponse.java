package com.janus.operation.api.dto;

import com.janus.operation.domain.model.CargoType;
import com.janus.operation.domain.model.InspectionType;
import com.janus.operation.domain.model.Operation;
import com.janus.operation.domain.model.OperationStatus;
import java.time.LocalDateTime;

public record OperationResponse(
        Long id,
        String referenceNumber,
        Long clientId,
        String clientName,
        CargoType cargoType,
        InspectionType inspectionType,
        OperationStatus status,
        Long assignedAgentId,
        String assignedAgentName,
        String notes,
        LocalDateTime closedAt,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static OperationResponse from(Operation op) {
        return new OperationResponse(
                op.id,
                op.referenceNumber,
                op.client != null ? op.client.id : null,
                op.client != null ? op.client.name : null,
                op.cargoType,
                op.inspectionType,
                op.status,
                op.assignedAgent != null ? op.assignedAgent.id : null,
                op.assignedAgent != null ? op.assignedAgent.fullName : null,
                op.notes,
                op.closedAt,
                op.createdAt,
                op.updatedAt
        );
    }
}
