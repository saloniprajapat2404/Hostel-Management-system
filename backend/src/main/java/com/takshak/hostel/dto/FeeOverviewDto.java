package com.takshak.hostel.dto;

import java.math.BigDecimal;

public record FeeOverviewDto(
        int totalStudents,
        int fullyPaidStudents,
        int partialStudents,
        int pendingStudents,
        BigDecimal totalExpected,
        BigDecimal totalCollected,
        BigDecimal totalOutstanding
) {
}
