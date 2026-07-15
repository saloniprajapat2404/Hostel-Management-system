package com.takshak.hostel.dto;

import com.takshak.hostel.enums.ComplaintStatus;
import java.time.Instant;

public record ComplaintDto(
        Long id,
        Long studentId,
        String studentName,
        String title,
        String description,
        ComplaintStatus status,
        Instant createdAt,
        Instant resolvedAt,
        Long handledById,
        String handledByName
) {
}
