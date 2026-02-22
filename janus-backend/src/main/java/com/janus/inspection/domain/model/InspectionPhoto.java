package com.janus.inspection.domain.model;

import com.janus.operation.domain.model.Operation;
import com.janus.shared.domain.BaseEntity;
import com.janus.user.domain.model.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "inspection_photos")
public class InspectionPhoto extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    public Operation operation;

    @ManyToOne(fetch = FetchType.LAZY)
    public User uploadedBy;

    @Column(name = "original_name", nullable = false)
    public String originalName;

    @Column(name = "stored_name", nullable = false)
    public String storedName;

    @Column(name = "file_path", nullable = false)
    public String filePath;

    @Column(name = "file_size")
    public Long fileSize;

    @Column(name = "mime_type")
    public String mimeType;

    @Column(columnDefinition = "TEXT")
    public String caption;

    @Column(nullable = false)
    public boolean active = true;
}
