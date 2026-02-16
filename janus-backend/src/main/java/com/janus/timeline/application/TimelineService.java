package com.janus.timeline.application;

import com.janus.comment.domain.repository.OperationCommentRepository;
import com.janus.document.domain.repository.DocumentVersionRepository;
import com.janus.operation.application.OperationService;
import com.janus.operation.domain.repository.StatusHistoryRepository;
import com.janus.timeline.api.dto.TimelineEventResponse;
import com.janus.timeline.api.dto.TimelineEventType;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

@ApplicationScoped
public class TimelineService {

    @Inject
    StatusHistoryRepository statusHistoryRepository;

    @Inject
    DocumentVersionRepository documentVersionRepository;

    @Inject
    OperationCommentRepository commentRepository;

    @Inject
    OperationService operationService;

    public List<TimelineEventResponse> getTimeline(Long operationId, TimelineEventType filterType) {
        operationService.findById(operationId);

        var events = new ArrayList<TimelineEventResponse>();

        if (filterType == null || filterType == TimelineEventType.STATUS_CHANGE) {
            var history = statusHistoryRepository.findByOperationId(operationId);
            for (var h : history) {
                events.add(new TimelineEventResponse(
                        TimelineEventType.STATUS_CHANGE,
                        h.previousStatus != null
                                ? "Status changed from " + h.previousStatus + " to " + h.newStatus
                                : "Operation created with status " + h.newStatus,
                        h.changedBy != null ? h.changedBy.username : null,
                        h.changedAt,
                        h.previousStatus != null ? h.previousStatus.name() : null,
                        h.newStatus.name(),
                        h.comment != null ? Map.of("comment", h.comment) : null
                ));
            }
        }

        if (filterType == null || filterType == TimelineEventType.DOCUMENT_UPLOAD
                || filterType == TimelineEventType.DOCUMENT_VERSION) {
            var versions = documentVersionRepository.findByOperationId(operationId);
            for (var v : versions) {
                var type = v.versionNumber == 1
                        ? TimelineEventType.DOCUMENT_UPLOAD
                        : TimelineEventType.DOCUMENT_VERSION;
                if (filterType == null || filterType == type) {
                    events.add(new TimelineEventResponse(
                            type,
                            v.versionNumber == 1
                                    ? "Document uploaded: " + v.originalName
                                    : "Document version " + v.versionNumber + ": " + v.originalName,
                            v.uploadedBy != null ? v.uploadedBy.username : null,
                            v.uploadedAt,
                            null, null,
                            Map.of(
                                    "documentId", v.document.id,
                                    "versionNumber", v.versionNumber,
                                    "fileName", v.originalName
                            )
                    ));
                }
            }
        }

        if (filterType == null || filterType == TimelineEventType.COMMENT) {
            var comments = commentRepository.findByOperationId(operationId);
            for (var c : comments) {
                events.add(new TimelineEventResponse(
                        TimelineEventType.COMMENT,
                        "Comment: " + c.content,
                        c.author != null ? c.author.username : null,
                        c.createdAt,
                        null, null,
                        Map.of("commentId", c.id)
                ));
            }
        }

        events.sort(Comparator.comparing(TimelineEventResponse::timestamp));
        return events;
    }
}
