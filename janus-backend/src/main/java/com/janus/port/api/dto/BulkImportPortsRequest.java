package com.janus.port.api.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record BulkImportPortsRequest(
        @NotBlank String country,
        @NotEmpty List<@Valid PortEntry> ports
) {
    public record PortEntry(@NotBlank String code, @NotBlank String name, String description) {}
}
