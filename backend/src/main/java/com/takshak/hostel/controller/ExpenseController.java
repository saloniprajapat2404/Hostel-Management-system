package com.takshak.hostel.controller;

import com.takshak.hostel.dto.CreateExpenseRequest;
import com.takshak.hostel.dto.ExpenseDto;
import com.takshak.hostel.service.ExpenseService;
import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/expenses")
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class ExpenseController {

    private final ExpenseService expenseService;

    public ExpenseController(ExpenseService expenseService) {
        this.expenseService = expenseService;
    }

    @GetMapping
    public List<ExpenseDto> list() {
        return expenseService.list();
    }

    @GetMapping("/total")
    public Map<String, BigDecimal> total() {
        return Map.of("totalExpenses", expenseService.totalExpenses());
    }

    @PostMapping
    public ExpenseDto create(@Valid @RequestBody CreateExpenseRequest request) {
        return expenseService.create(request);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable String id) {
        expenseService.delete(id);
    }
}
