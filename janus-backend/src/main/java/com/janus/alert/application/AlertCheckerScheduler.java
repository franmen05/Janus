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
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

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

    @ConfigProperty(name = "janus.alerts.arrival-date-approaching-hours", defaultValue = "24")
    int arrivalDateApproachingHours;

    @Scheduled(every = "1h", identity = "alert-checker")
    @Transactional
    void checkAlerts() {
        runChecks();
    }

    public void runChecks() {
        LOG.info("Running alert checks...");
        checkInactivity();
        checkArrivalDateApproaching();
        checkMissingCriticalDocuments();
        checkBLUnavailable();
        checkDeclarationDeadline();
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

    void checkArrivalDateApproaching() {
        var now = LocalDateTime.now();
        var threshold = now.plusHours(arrivalDateApproachingHours);
        var operations = operationRepository.findWithArrivalDateBetween(now, threshold);

        for (var op : operations) {
            var alert = alertService.createAlert(op, AlertType.DEADLINE_APPROACHING,
                    "Operation " + op.referenceNumber + " arrival date is approaching (within "
                            + arrivalDateApproachingHours + " hours)");
            if (alert != null) {
                notificationService.send(
                        op.id, op.client.email,
                        "Arrival Date Approaching - " + op.referenceNumber,
                        "Operation " + op.referenceNumber + " arrival date is approaching."
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

    void checkDeclarationDeadline() {
        var now = LocalDateTime.now();
        var operations = operationRepository.findArrivedWithoutDeclaration(now);
        var dateFormatter = DateTimeFormatter.ofPattern("MMM dd, yyyy");
        var isoFormatter = DateTimeFormatter.ISO_LOCAL_DATE;

        for (var op : operations) {
            var arrivalDate = op.estimatedArrival.toLocalDate();
            var deadline = calculateBusinessDayDeadline(arrivalDate, 5);
            var message = "Operation " + op.referenceNumber + " arrived on "
                    + arrivalDate.format(dateFormatter)
                    + ". You have 5 business days to file the customs declaration.";
            var messageParams = "{\"ref\":\"" + op.referenceNumber
                    + "\",\"arrivalDate\":\"" + arrivalDate.format(isoFormatter)
                    + "\",\"deadline\":\"" + deadline.format(isoFormatter) + "\"}";

            var alert = alertService.createAlert(op, AlertType.DECLARATION_DEADLINE, message, messageParams);
            if (alert != null && op.client != null && op.client.email != null) {
                notificationService.send(
                        op.id, op.client.email,
                        "Declaration Deadline - " + op.referenceNumber,
                        message
                );
            }
        }
    }

    private LocalDate calculateBusinessDayDeadline(LocalDate startDate, int businessDays) {
        var date = startDate;
        var count = 0;
        while (count < businessDays) {
            date = date.plusDays(1);
            if (date.getDayOfWeek() != DayOfWeek.SATURDAY && date.getDayOfWeek() != DayOfWeek.SUNDAY) {
                count++;
            }
        }
        return date;
    }
}
