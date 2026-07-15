package com.takshak.hostel.repository;

import com.takshak.hostel.entity.Complaint;
import com.takshak.hostel.entity.User;
import com.takshak.hostel.enums.ComplaintStatus;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface ComplaintRepository extends JpaRepository<Complaint, Long> {
    List<Complaint> findByStudentOrderByCreatedAtDesc(User student);
    long countByStatus(ComplaintStatus status);

    @Query("""
            SELECT c FROM Complaint c
            JOIN FETCH c.student
            LEFT JOIN FETCH c.handledBy
            ORDER BY c.createdAt DESC
            """)
    List<Complaint> findAllDetailed();
}
