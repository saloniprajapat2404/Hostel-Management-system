package com.takshak.hostel.dto;

import com.takshak.hostel.entity.StudentFee;
import com.takshak.hostel.enums.FeeStatus;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record StudentFeeDetailDto(
        Long id,
        String feeType,
        String academicYear,
        BigDecimal totalAmount,
        BigDecimal paidAmount,
        BigDecimal balanceAmount,
        LocalDate dueDate,
        FeeStatus status,
        List<FeePaymentDto> payments
) {
    public static StudentFeeDetailDto from(StudentFee fee) {
        BigDecimal balance = fee.getTotalAmount().subtract(fee.getPaidAmount());
        List<FeePaymentDto> payments = fee.getPayments().stream()
                .map(FeePaymentDto::from)
                .toList();
        return new StudentFeeDetailDto(
                fee.getId(),
                fee.getFeeType(),
                fee.getAcademicYear(),
                fee.getTotalAmount(),
                fee.getPaidAmount(),
                balance.max(BigDecimal.ZERO),
                fee.getDueDate(),
                fee.getStatus(),
                payments
        );
    }
}
