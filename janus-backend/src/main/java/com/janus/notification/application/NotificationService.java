package com.janus.notification.application;

import com.janus.notification.domain.model.Notification;
import com.janus.notification.domain.model.NotificationStatus;
import com.janus.notification.domain.repository.NotificationRepository;
import com.janus.notification.infrastructure.EmailNotificationAdapter;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.time.LocalDateTime;
import org.jboss.logging.Logger;

@ApplicationScoped
public class NotificationService {

    private static final Logger LOG = Logger.getLogger(NotificationService.class);

    @Inject
    NotificationRepository notificationRepository;

    @Inject
    EmailNotificationAdapter emailAdapter;

    @Transactional
    public void sendStatusChangeNotification(Long operationId, String recipientEmail,
                                              String operationRef, String newStatus) {
        var subject = "Operation " + operationRef + " - Status Update";
        var body = """
                Your operation %s has been updated to status: %s.

                Please log in to the Janus platform for more details.
                """.formatted(operationRef, newStatus);

        send(operationId, recipientEmail, subject, body);
    }

    @Transactional
    public void send(Long operationId, String recipientEmail, String subject, String body) {
        var notification = new Notification();
        notification.operationId = operationId;
        notification.recipientEmail = recipientEmail;
        notification.subject = subject;
        notification.body = body;

        try {
            emailAdapter.send(recipientEmail, subject, body);
            notification.status = NotificationStatus.SENT;
            notification.sentAt = LocalDateTime.now();
        } catch (Exception e) {
            LOG.errorf("Failed to send notification to %s: %s", recipientEmail, e.getMessage());
            notification.status = NotificationStatus.FAILED;
            notification.errorMessage = e.getMessage();
        }

        notificationRepository.persist(notification);
    }
}
