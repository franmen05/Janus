package com.janus.billing.infrastructure.dto;

public record BillFlowClientRequest(
    String firstName, String lastName,
    String idDocumentType, String idDocumentNumber,
    String email, String phone, String address
) {}
