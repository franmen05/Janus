package com.janus.operation.api.dto;

import com.janus.operation.domain.model.BlAvailability;
import com.janus.operation.domain.model.BlType;
import com.janus.operation.domain.model.CargoType;
import com.janus.operation.domain.model.InspectionType;
import com.janus.operation.domain.model.OperationCategory;
import com.janus.operation.domain.model.Operation;
import com.janus.operation.domain.model.OperationStatus;
import com.janus.operation.domain.model.OperationType;
import com.janus.operation.domain.model.TransportMode;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record OperationResponse(
        Long id,
        String referenceNumber,
        Long customerId,
        String customerName,
        OperationType operationType,
        TransportMode transportMode,
        CargoType cargoType,
        OperationCategory operationCategory,
        OperationStatus status,
        Long assignedAgentId,
        String assignedAgentName,
        String blNumber,
        String containerNumber,
        LocalDateTime estimatedArrival,
        BlAvailability blAvailability,
        Boolean blOriginalAvailable,
        String notes,
        LocalDateTime arrivalDate,
        LocalDateTime closedAt,
        InspectionType inspectionType,
        LocalDateTime inspectionSetAt,
        String incoterm,
        BlType blType,
        String childBlNumber,
        Boolean localChargesValidated,
        LocalDateTime valuationFinalizedAt,
        Long arrivalPortId,
        String arrivalPortCode,
        String arrivalPortName,
        Long originPortId,
        String originPortCode,
        String originPortName,
        Long depositoId,
        String depositoCode,
        String depositoName,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        // Cargo dimension fields
        Integer pieces,
        BigDecimal grossWeight,
        BigDecimal volumetricWeight,
        BigDecimal volume,
        BigDecimal declaredValue
) {
    public static OperationResponse from(Operation op) {
        return new OperationResponse(
                op.id,
                op.referenceNumber,
                op.customer != null ? op.customer.id : null,
                op.customer != null ? op.customer.name : null,
                op.operationType,
                op.transportMode,
                op.cargoType,
                op.operationCategory,
                op.status,
                op.assignedAgent != null ? op.assignedAgent.id : null,
                op.assignedAgent != null ? op.assignedAgent.fullName : null,
                op.blNumber,
                op.containerNumber,
                op.estimatedArrival,
                op.blAvailability,
                op.blAvailability != BlAvailability.NOT_AVAILABLE,
                op.notes,
                op.arrivalDate,
                op.closedAt,
                op.inspectionType,
                op.inspectionSetAt,
                op.incoterm,
                op.blType,
                op.childBlNumber,
                op.localChargesValidated,
                op.valuationFinalizedAt,
                op.arrivalPort != null ? op.arrivalPort.id : null,
                op.arrivalPort != null ? op.arrivalPort.code : null,
                op.arrivalPort != null ? op.arrivalPort.name : null,
                op.originPort != null ? op.originPort.id : null,
                op.originPort != null ? op.originPort.code : null,
                op.originPort != null ? op.originPort.name : null,
                op.deposito != null ? op.deposito.id : null,
                op.deposito != null ? op.deposito.code : null,
                op.deposito != null ? op.deposito.name : null,
                op.createdAt,
                op.updatedAt,
                op.pieces,
                op.grossWeight,
                op.volumetricWeight,
                op.volume,
                op.declaredValue
        );
    }
}
