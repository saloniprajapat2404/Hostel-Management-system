package com.takshak.hostel.dto;

import com.takshak.hostel.enums.CheckType;
import java.time.Instant;

public record AttendanceDto(
        Long id,
        Long studentId,
        String studentName,
        String studentCode,
        CheckType type,
        Instant timestamp,
        Long recordedById,
        String recordedByName,
        String notes
) {
}
