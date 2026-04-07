package com.janus.billing.infrastructure.dto;

public record BillFlowClientResponse(
    Long id, String firstName, String lastName,
    String idDocumentType, String idDocumentNumber,
    boolean created
) {}
