package com.takshak.hostel.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import java.time.LocalDate;

public record CreateStudentFeeRequest(
        @NotBlank String feeType,
        @NotBlank String academicYear,
        @NotNull @Positive BigDecimal totalAmount,
        LocalDate dueDate
) {
}
