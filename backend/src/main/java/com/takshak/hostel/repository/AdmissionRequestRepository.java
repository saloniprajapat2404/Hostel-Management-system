package com.takshak.hostel.repository;

import com.takshak.hostel.entity.AdmissionRequest;
import com.takshak.hostel.enums.AdmissionStatus;
import java.time.Instant;
import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface AdmissionRequestRepository extends MongoRepository<AdmissionRequest, String> {
    List<AdmissionRequest> findAllByOrderByCreatedAtDesc();
    List<AdmissionRequest> findByBranchIdOrderByCreatedAtDesc(String branchId);
    long countByStatus(AdmissionStatus status);
    long countByBranchIdAndStatus(String branchId, AdmissionStatus status);
    List<AdmissionRequest> findByBranchIdAndCreatedAtAfterOrderByCreatedAtAsc(String branchId, Instant since);
    List<AdmissionRequest> findByCreatedAtAfterOrderByCreatedAtAsc(Instant since);
}
