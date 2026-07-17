package com.takshak.hostel.dto;

import com.takshak.hostel.enums.CheckType;
import java.time.Instant;

public record AttendanceDto(
        String id,
        String studentId,
        String studentName,
        String studentCode,
        CheckType type,
        Instant timestamp,
        String recordedById,
        String recordedByName,
        String notes
) {
}
