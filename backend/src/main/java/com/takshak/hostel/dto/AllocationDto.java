package com.takshak.hostel.dto;

import java.time.Instant;

public record AllocationDto(
        Long id,
        Long studentId,
        String studentName,
        String studentEmail,
        String studentCode,
        Long bedId,
        String roomNumber,
        String bedLabel,
        Instant allocatedAt,
        boolean active,
        Long allocatedById,
        String allocatedByName
) {
}
