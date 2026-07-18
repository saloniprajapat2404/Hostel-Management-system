package com.takshak.hostel.dto;

import com.takshak.hostel.entity.Expense;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record ExpenseDto(
        String id,
        String category,
        String description,
        BigDecimal amount,
        LocalDate expenseDate,
        String recordedByName,
        Instant createdAt
) {
    public static ExpenseDto from(Expense expense) {
        return new ExpenseDto(
                expense.getId(),
                expense.getCategory(),
                expense.getDescription(),
                expense.getAmount(),
                expense.getExpenseDate(),
                expense.getRecordedByName(),
                expense.getCreatedAt()
        );
    }
}
