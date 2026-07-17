package com.takshak.hostel.dto;

import com.takshak.hostel.enums.ComplaintStatus;
import java.time.Instant;

public record ComplaintDto(
        String id,
        String studentId,
        String studentName,
        String title,
        String description,
        ComplaintStatus status,
        Instant createdAt,
        Instant resolvedAt,
        String handledById,
        String handledByName
) {
}
