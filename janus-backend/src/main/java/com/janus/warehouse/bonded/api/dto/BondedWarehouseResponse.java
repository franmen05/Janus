package com.janus.warehouse.bonded.api.dto;

import com.janus.warehouse.bonded.domain.model.BondedWarehouse;
import java.time.LocalDateTime;

public record BondedWarehouseResponse(
        Long id,
        String code,
        String name,
        String description,
        Integer secuencia,
        String tipoLocalizacion,
        String centroLogistico,
        String ubicacionArea,
        String paisOrigen,
        boolean active,
        LocalDateTime createdAt
) {
    public static BondedWarehouseResponse from(BondedWarehouse w) {
        return new BondedWarehouseResponse(
                w.id,
                w.code,
                w.name,
                w.description,
                w.secuencia,
                w.tipoLocalizacion,
                w.centroLogistico,
                w.ubicacionArea,
                w.paisOrigen,
                w.active,
                w.createdAt
        );
    }
}
