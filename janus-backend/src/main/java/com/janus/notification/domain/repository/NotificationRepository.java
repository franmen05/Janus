package com.janus.notification.domain.repository;

import com.janus.notification.domain.model.Notification;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;

@ApplicationScoped
public class NotificationRepository implements PanacheRepository<Notification> {

    public List<Notification> findByOperationId(Long operationId) {
        return list("operationId ORDER BY createdAt DESC", operationId);
    }
}
