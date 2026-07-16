package com.takshak.hostel.dto;

import com.takshak.hostel.entity.FeePayment;
import com.takshak.hostel.enums.PaymentMethod;
import java.math.BigDecimal;
import java.time.Instant;

public record FeePaymentDto(
        Long id,
        Long feeId,
        String feeType,
        BigDecimal amount,
        PaymentMethod method,
        Instant paidAt,
        String referenceNote,
        String recordedByName
) {
    public static FeePaymentDto from(FeePayment payment) {
        String recorder = payment.getRecordedBy() != null ? payment.getRecordedBy().getFullName() : null;
        return new FeePaymentDto(
                payment.getId(),
                payment.getStudentFee().getId(),
                payment.getStudentFee().getFeeType(),
                payment.getAmount(),
                payment.getMethod(),
                payment.getPaidAt(),
                payment.getReferenceNote(),
                recorder
        );
    }
}
