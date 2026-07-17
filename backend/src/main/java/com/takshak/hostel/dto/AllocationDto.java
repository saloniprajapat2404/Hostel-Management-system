package com.takshak.hostel.dto;

import java.time.Instant;

public record AllocationDto(
        String id,
        String studentId,
        String studentName,
        String studentEmail,
        String studentCode,
        String bedId,
        String roomNumber,
        String bedLabel,
        Instant allocatedAt,
        boolean active,
        String allocatedById,
        String allocatedByName
) {
}
