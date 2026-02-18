package com.janus.alert.application;

import com.janus.alert.domain.model.AlertType;
import com.janus.notification.application.NotificationService;
import com.janus.operation.domain.repository.OperationRepository;
import io.quarkus.scheduler.Scheduled;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;
import java.time.LocalDateTime;

@ApplicationScoped
public class AlertCheckerScheduler {

    private static final Logger LOG = Logger.getLogger(AlertCheckerScheduler.class);

    @Inject
    OperationRepository operationRepository;

    @Inject
    AlertService alertService;

    @Inject
    NotificationService notificationService;

    @ConfigProperty(name = "janus.alerts.inactivity-hours", defaultValue = "48")
    int inactivityHours;

    @ConfigProperty(name = "janus.alerts.deadline-approaching-hours", defaultValue = "24")
    int deadlineApproachingHours;

    @Scheduled(every = "1h", identity = "alert-checker")
    @Transactional
    void checkAlerts() {
        LOG.info("Running alert checks...");
        checkInactivity();
        checkDeadlineApproaching();
    }

    void checkInactivity() {
        var threshold = LocalDateTime.now().minusHours(inactivityHours);
        var operations = operationRepository.findInactiveSince(threshold);

        for (var op : operations) {
            var alert = alertService.createAlert(op, AlertType.INACTIVITY_48H,
                    "Operation " + op.referenceNumber + " has been inactive for more than "
                            + inactivityHours + " hours");
            if (alert != null) {
                notificationService.send(
                        op.id, op.client.email,
                        "Inactivity Alert - " + op.referenceNumber,
                        "Operation " + op.referenceNumber + " has been inactive for over "
                                + inactivityHours + " hours."
                );
            }
        }
    }

    void checkDeadlineApproaching() {
        var now = LocalDateTime.now();
        var threshold = now.plusHours(deadlineApproachingHours);
        var operations = operationRepository.findWithDeadlineBetween(now, threshold);

        for (var op : operations) {
            var alert = alertService.createAlert(op, AlertType.DEADLINE_APPROACHING,
                    "Operation " + op.referenceNumber + " deadline is approaching (within "
                            + deadlineApproachingHours + " hours)");
            if (alert != null) {
                notificationService.send(
                        op.id, op.client.email,
                        "Deadline Approaching - " + op.referenceNumber,
                        "Operation " + op.referenceNumber + " deadline is approaching."
                );
            }
        }
    }
}
