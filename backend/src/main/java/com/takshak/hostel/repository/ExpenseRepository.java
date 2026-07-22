package com.takshak.hostel.repository;

import com.takshak.hostel.entity.Expense;
import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface ExpenseRepository extends MongoRepository<Expense, String> {
    List<Expense> findAllByOrderByExpenseDateDescCreatedAtDesc();
    List<Expense> findByBranchIdOrderByExpenseDateDescCreatedAtDesc(String branchId);
}
