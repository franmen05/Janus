package com.janus.comment.domain.repository;

import com.janus.comment.domain.model.OperationComment;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;

@ApplicationScoped
public class OperationCommentRepository implements PanacheRepository<OperationComment> {

    public List<OperationComment> findByOperationId(Long operationId) {
        return list("operation.id = ?1 ORDER BY createdAt ASC", operationId);
    }
}
