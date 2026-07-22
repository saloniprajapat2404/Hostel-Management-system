package com.takshak.hostel.repository;

import com.takshak.hostel.entity.Complaint;
import com.takshak.hostel.enums.ComplaintStatus;
import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface ComplaintRepository extends MongoRepository<Complaint, String> {
    List<Complaint> findByStudentIdOrderByCreatedAtDesc(String studentId);
    List<Complaint> findAllByOrderByCreatedAtDesc();
    List<Complaint> findByBranchIdOrderByCreatedAtDesc(String branchId);
    long countByStatus(ComplaintStatus status);
    long countByBranchIdAndStatus(String branchId, ComplaintStatus status);
}
