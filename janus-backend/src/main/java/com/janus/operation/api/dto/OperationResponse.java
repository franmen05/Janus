package com.janus.operation.api.dto;

import com.janus.operation.domain.model.BlType;
import com.janus.operation.domain.model.CargoType;
import com.janus.operation.domain.model.InspectionType;
import com.janus.operation.domain.model.OperationCategory;
import com.janus.operation.domain.model.Operation;
import com.janus.operation.domain.model.OperationStatus;
import com.janus.operation.domain.model.TransportMode;
import java.time.LocalDateTime;

public record OperationResponse(
        Long id,
        String referenceNumber,
        Long clientId,
        String clientName,
        TransportMode transportMode,
        CargoType cargoType,
        OperationCategory operationCategory,
        OperationStatus status,
        Long assignedAgentId,
        String assignedAgentName,
        String blNumber,
        String containerNumber,
        LocalDateTime estimatedArrival,
        Boolean blOriginalAvailable,
        String notes,
        LocalDateTime deadline,
        LocalDateTime closedAt,
        InspectionType inspectionType,
        LocalDateTime inspectionSetAt,
        String incoterm,
        BlType blType,
        String childBlNumber,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static OperationResponse from(Operation op) {
        return new OperationResponse(
                op.id,
                op.referenceNumber,
                op.client != null ? op.client.id : null,
                op.client != null ? op.client.name : null,
                op.transportMode,
                op.cargoType,
                op.operationCategory,
                op.status,
                op.assignedAgent != null ? op.assignedAgent.id : null,
                op.assignedAgent != null ? op.assignedAgent.fullName : null,
                op.blNumber,
                op.containerNumber,
                op.estimatedArrival,
                op.blOriginalAvailable,
                op.notes,
                op.deadline,
                op.closedAt,
                op.inspectionType,
                op.inspectionSetAt,
                op.incoterm,
                op.blType,
                op.childBlNumber,
                op.createdAt,
                op.updatedAt
        );
    }
}
