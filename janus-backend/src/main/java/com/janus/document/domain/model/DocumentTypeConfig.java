package com.janus.document.domain.model;

import com.janus.shared.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "document_type_configs")
public class DocumentTypeConfig extends BaseEntity {

    @Column(unique = true, nullable = false)
    public String code;

    @Column(name = "allow_multiple", nullable = false)
    public boolean allowMultiple = false;
}
