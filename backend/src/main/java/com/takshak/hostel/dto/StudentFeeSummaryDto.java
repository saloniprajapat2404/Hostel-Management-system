package com.takshak.hostel.dto;

import com.takshak.hostel.enums.FeeStatus;
import com.takshak.hostel.enums.PaymentMethod;
import java.math.BigDecimal;

public record StudentFeeSummaryDto(
        String studentId,
        String fullName,
        String email,
        String studentCode,
        BigDecimal totalFees,
        BigDecimal totalPaid,
        BigDecimal balance,
        FeeStatus overallStatus,
        int feeRecordCount,
        PaymentMethod lastPaymentMethod
) {
}
