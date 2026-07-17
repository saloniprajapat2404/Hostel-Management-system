package com.takshak.hostel.dto;

import com.takshak.hostel.entity.FeePayment;
import com.takshak.hostel.entity.StudentFee;
import com.takshak.hostel.enums.PaymentMethod;
import java.math.BigDecimal;
import java.time.Instant;

public record FeePaymentDto(
        String id,
        String feeId,
        String feeType,
        BigDecimal amount,
        PaymentMethod method,
        Instant paidAt,
        String referenceNote,
        String recordedByName
) {
    public static FeePaymentDto from(FeePayment payment, StudentFee fee) {
        return new FeePaymentDto(
                payment.getId(),
                fee.getId(),
                fee.getFeeType(),
                payment.getAmount(),
                payment.getMethod(),
                payment.getPaidAt(),
                payment.getReferenceNote(),
                payment.getRecordedByName()
        );
    }
}
