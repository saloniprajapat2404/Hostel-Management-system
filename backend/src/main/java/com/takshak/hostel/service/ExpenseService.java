package com.takshak.hostel.service;

import com.takshak.hostel.dto.CreateExpenseRequest;
import com.takshak.hostel.dto.ExpenseDto;
import com.takshak.hostel.entity.Expense;
import com.takshak.hostel.entity.User;
import com.takshak.hostel.enums.Role;
import com.takshak.hostel.exception.ApiException;
import com.takshak.hostel.repository.ExpenseRepository;
import com.takshak.hostel.security.BranchScope;
import com.takshak.hostel.security.SecurityUtils;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final BranchScope branchScope;

    public ExpenseService(ExpenseRepository expenseRepository, BranchScope branchScope) {
        this.expenseRepository = expenseRepository;
        this.branchScope = branchScope;
    }

    public List<ExpenseDto> list() {
        assertSuperAdminAccess();
        String branchId = branchScope.requireBranchId();
        return expenseRepository.findByBranchIdOrderByExpenseDateDescCreatedAtDesc(branchId).stream()
                .map(ExpenseDto::from)
                .toList();
    }

    public BigDecimal totalExpenses() {
        assertSuperAdminAccess();
        String branchId = branchScope.requireBranchId();
        return expenseRepository.findByBranchIdOrderByExpenseDateDescCreatedAtDesc(branchId).stream()
                .map(Expense::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public ExpenseDto create(CreateExpenseRequest request) {
        assertSuperAdminAccess();
        User actor = SecurityUtils.currentUser();
        String branchId = branchScope.requireBranchId();

        Expense expense = new Expense();
        expense.setCategory(request.category().trim());
        expense.setDescription(trimToNull(request.description()));
        expense.setAmount(request.amount());
        expense.setExpenseDate(request.expenseDate());
        expense.setRecordedById(actor.getId());
        expense.setRecordedByName(actor.getFullName());
        expense.setBranchId(branchId);
        return ExpenseDto.from(expenseRepository.save(expense));
    }

    public void delete(String id) {
        assertSuperAdminAccess();
        String branchId = branchScope.requireBranchId();
        Expense expense = expenseRepository.findById(id)
                .orElseThrow(() -> new ApiException("Expense not found", 404));
        if (expense.getBranchId() == null || !expense.getBranchId().equals(branchId)) {
            throw new ApiException("Expense not found", 404);
        }
        expenseRepository.deleteById(id);
    }

    private void assertSuperAdminAccess() {
        if (SecurityUtils.currentUser().getRole() != Role.SUPER_ADMIN) {
            throw new ApiException("Access denied", 403);
        }
    }

    private String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
