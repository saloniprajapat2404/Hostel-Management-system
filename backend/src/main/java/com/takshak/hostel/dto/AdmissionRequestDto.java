package com.takshak.hostel.dto;

import com.takshak.hostel.enums.AdmissionStatus;
import java.time.Instant;

public record AdmissionRequestDto(
        String id,
        String studentName,
        String email,
        String phone,
        String studentId,
        AdmissionStatus status,
        String notes,
        Instant createdAt,
        String reviewedById,
        String reviewedByName,
        Instant reviewedAt
) {
}
