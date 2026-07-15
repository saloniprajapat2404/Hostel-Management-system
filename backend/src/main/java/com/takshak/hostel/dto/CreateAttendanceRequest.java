package com.takshak.hostel.dto;

import com.takshak.hostel.enums.CheckType;
import jakarta.validation.constraints.NotNull;

public record CreateAttendanceRequest(
        @NotNull Long studentId,
        @NotNull CheckType type,
        String notes
) {
}
