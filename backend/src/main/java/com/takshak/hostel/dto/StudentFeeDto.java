package com.takshak.hostel.dto;

import com.takshak.hostel.entity.StudentFee;
import com.takshak.hostel.enums.FeeStatus;
import java.math.BigDecimal;
import java.time.LocalDate;

public record StudentFeeDto(
        String id,
        String feeType,
        String academicYear,
        BigDecimal totalAmount,
        BigDecimal paidAmount,
        BigDecimal balanceAmount,
        LocalDate dueDate,
        FeeStatus status
) {
    public static StudentFeeDto from(StudentFee fee) {
        BigDecimal balance = fee.getTotalAmount().subtract(fee.getPaidAmount());
        return new StudentFeeDto(
                fee.getId(),
                fee.getFeeType(),
                fee.getAcademicYear(),
                fee.getTotalAmount(),
                fee.getPaidAmount(),
                balance.max(BigDecimal.ZERO),
                fee.getDueDate(),
                fee.getStatus()
        );
    }
}
