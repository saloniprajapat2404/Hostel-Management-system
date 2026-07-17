package com.takshak.hostel.dto;

import com.takshak.hostel.enums.CheckType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateAttendanceRequest(
        @NotBlank String studentId,
        @NotNull CheckType type,
        String notes
) {
}
