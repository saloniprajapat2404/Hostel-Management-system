package com.takshak.hostel.repository;

import com.takshak.hostel.entity.StudentFee;
import com.takshak.hostel.entity.User;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface StudentFeeRepository extends JpaRepository<StudentFee, Long> {
    List<StudentFee> findByStudentOrderByDueDateDesc(User student);

    @Query("""
            SELECT DISTINCT sf FROM StudentFee sf
            LEFT JOIN FETCH sf.payments
            WHERE sf.student = :student
            ORDER BY sf.dueDate DESC
            """)
    List<StudentFee> findByStudentWithPayments(@Param("student") User student);

    @Query("""
            SELECT DISTINCT sf FROM StudentFee sf
            JOIN FETCH sf.student s
            LEFT JOIN FETCH sf.payments
            WHERE s.id = :studentId
            ORDER BY sf.dueDate DESC
            """)
    List<StudentFee> findByStudentIdWithPayments(@Param("studentId") Long studentId);

    @Query("""
            SELECT sf FROM StudentFee sf
            JOIN FETCH sf.student
            JOIN FETCH sf.payments p
            LEFT JOIN FETCH p.recordedBy
            WHERE sf.id = :feeId
            """)
    StudentFee findByIdWithPayments(@Param("feeId") Long feeId);
}
