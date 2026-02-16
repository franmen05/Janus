package com.janus.document.domain.model;

import com.janus.operation.domain.model.Operation;
import com.janus.shared.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "documents")
public class Document extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    public Operation operation;

    @Enumerated(EnumType.STRING)
    @Column(name = "document_type", nullable = false)
    public DocumentType documentType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    public DocumentStatus status = DocumentStatus.PENDING;

    @Column(nullable = false)
    public boolean active = true;
}
