package com.janus.warehouse.api.dto;

import com.janus.warehouse.domain.model.Warehouse;
import java.time.LocalDateTime;

public record WarehouseResponse(
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
    public static WarehouseResponse from(Warehouse warehouse) {
        return new WarehouseResponse(
                warehouse.id,
                warehouse.code,
                warehouse.name,
                warehouse.description,
                warehouse.secuencia,
                warehouse.tipoLocalizacion,
                warehouse.centroLogistico,
                warehouse.ubicacionArea,
                warehouse.paisOrigen,
                warehouse.active,
                warehouse.createdAt
        );
    }
}
