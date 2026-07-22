package com.takshak.hostel.repository;

import com.takshak.hostel.entity.StudentFee;
import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface StudentFeeRepository extends MongoRepository<StudentFee, String> {
    List<StudentFee> findByStudentIdOrderByDueDateDesc(String studentId);
    List<StudentFee> findByBranchId(String branchId);
    boolean existsByStudentIdAndFeeTypeAndAcademicYear(String studentId, String feeType, String academicYear);
}
