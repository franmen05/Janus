package com.janus.warehouse.api.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateWarehouseRequest(
        @NotBlank String code,
        @NotBlank String name,
        String description,
        Integer secuencia,
        String tipoLocalizacion,
        String centroLogistico,
        String ubicacionArea,
        String paisOrigen
) {}
