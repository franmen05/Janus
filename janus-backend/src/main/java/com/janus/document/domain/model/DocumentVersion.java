package com.janus.document.domain.model;

import com.janus.shared.domain.BaseEntity;
import com.janus.user.domain.model.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "document_versions")
public class DocumentVersion extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    public Document document;

    @Column(name = "version_number", nullable = false)
    public int versionNumber;

    @Column(name = "original_name", nullable = false)
    public String originalName;

    @Column(name = "stored_name", nullable = false)
    public String storedName;

    @Column(name = "file_path", nullable = false)
    public String filePath;

    @Column(name = "file_size")
    public long fileSize;

    @Column(name = "mime_type")
    public String mimeType;

    @ManyToOne(fetch = FetchType.LAZY)
    public User uploadedBy;

    @Column(name = "change_reason")
    public String changeReason;

    @Column(name = "uploaded_at", nullable = false, updatable = false)
    public LocalDateTime uploadedAt;

    @Column(nullable = false)
    public boolean active = true;

    @Override
    @PrePersist
    public void prePersist() {
        super.prePersist();
        if (this.uploadedAt == null) {
            this.uploadedAt = LocalDateTime.now();
        }
    }
}
