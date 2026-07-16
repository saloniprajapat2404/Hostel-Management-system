package com.takshak.hostel.repository;

import com.takshak.hostel.entity.FeePayment;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FeePaymentRepository extends JpaRepository<FeePayment, Long> {
}
