package com.takshak.hostel.service;

import com.takshak.hostel.dto.CreateExpenseRequest;
import com.takshak.hostel.dto.ExpenseDto;
import com.takshak.hostel.entity.Expense;
import com.takshak.hostel.entity.User;
import com.takshak.hostel.enums.Role;
import com.takshak.hostel.exception.ApiException;
import com.takshak.hostel.repository.ExpenseRepository;
import com.takshak.hostel.security.SecurityUtils;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class ExpenseService {

    private final ExpenseRepository expenseRepository;

    public ExpenseService(ExpenseRepository expenseRepository) {
        this.expenseRepository = expenseRepository;
    }

    public List<ExpenseDto> list() {
        assertAdminAccess();
        return expenseRepository.findAllByOrderByExpenseDateDescCreatedAtDesc().stream()
                .map(ExpenseDto::from)
                .toList();
    }

    public BigDecimal totalExpenses() {
        assertAdminAccess();
        return expenseRepository.findAllByOrderByExpenseDateDescCreatedAtDesc().stream()
                .map(Expense::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public ExpenseDto create(CreateExpenseRequest request) {
        assertAdminAccess();
        User actor = SecurityUtils.currentUser();

        Expense expense = new Expense();
        expense.setCategory(request.category().trim());
        expense.setDescription(trimToNull(request.description()));
        expense.setAmount(request.amount());
        expense.setExpenseDate(request.expenseDate());
        expense.setRecordedById(actor.getId());
        expense.setRecordedByName(actor.getFullName());
        return ExpenseDto.from(expenseRepository.save(expense));
    }

    public void delete(String id) {
        assertAdminAccess();
        if (!expenseRepository.existsById(id)) {
            throw new ApiException("Expense not found", 404);
        }
        expenseRepository.deleteById(id);
    }

    private void assertAdminAccess() {
        Role role = SecurityUtils.currentUser().getRole();
        if (role != Role.ADMIN && role != Role.SUPER_ADMIN) {
            throw new ApiException("Access denied", 403);
        }
    }

    private String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
