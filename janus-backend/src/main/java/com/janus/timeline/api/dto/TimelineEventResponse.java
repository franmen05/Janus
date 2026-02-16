package com.janus.timeline.api.dto;

import java.time.LocalDateTime;
import java.util.Map;

public record TimelineEventResponse(
        TimelineEventType eventType,
        String description,
        String username,
        LocalDateTime timestamp,
        String previousStatus,
        String newStatus,
        Map<String, Object> metadata
) {}
