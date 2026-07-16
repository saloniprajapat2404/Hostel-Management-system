package com.takshak.hostel.dto;

import com.takshak.hostel.enums.PaymentMethod;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

public record RecordPaymentRequest(
        @NotNull @Positive BigDecimal amount,
        @NotNull PaymentMethod method,
        String referenceNote
) {
}
