package com.janus.alert.application;

import com.janus.alert.domain.model.AlertType;
import com.janus.document.domain.service.DocumentCompletenessService;
import com.janus.notification.application.NotificationService;
import com.janus.operation.domain.model.OperationStatus;
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

    @Inject
    DocumentCompletenessService completenessService;

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
        checkMissingCriticalDocuments();
        checkBLUnavailable();
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

    void checkMissingCriticalDocuments() {
        var operations = operationRepository.findByStatus(OperationStatus.IN_REVIEW);

        for (var op : operations) {
            var completeness = completenessService.calculate(op.id);
            if ("RED".equals(completeness.color()) || "YELLOW".equals(completeness.color())) {
                alertService.createAlert(op, AlertType.MISSING_CRITICAL_DOCUMENT,
                        "Operation " + op.referenceNumber + " is in review but has incomplete documentation ("
                                + completeness.percentage() + "% complete)");
            }
        }
    }

    void checkBLUnavailable() {
        // Check operations in IN_REVIEW or later review statuses where BL original is not available
        var reviewStatuses = java.util.List.of(
                OperationStatus.IN_REVIEW,
                OperationStatus.PRELIQUIDATION_REVIEW,
                OperationStatus.ANALYST_ASSIGNED
        );

        for (var status : reviewStatuses) {
            var operations = operationRepository.findByStatus(status);
            for (var op : operations) {
                if (op.blAvailability == null || op.blAvailability == com.janus.operation.domain.model.BlAvailability.NOT_AVAILABLE) {
                    alertService.createAlert(op, AlertType.BL_UNAVAILABLE,
                            "Operation " + op.referenceNumber + " does not have original BL available");
                }
            }
        }
    }
}
