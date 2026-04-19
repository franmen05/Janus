package com.janus.warehouse.bonded.api.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateBondedWarehouseRequest(
        @NotBlank String code,
        @NotBlank String name,
        String description,
        Integer secuencia,
        String tipoLocalizacion,
        String centroLogistico,
        String ubicacionArea,
        String paisOrigen
) {}
