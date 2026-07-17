package com.takshak.hostel.repository;

import com.takshak.hostel.entity.AdmissionRequest;
import com.takshak.hostel.enums.AdmissionStatus;
import java.time.Instant;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AdmissionRequestRepository extends JpaRepository<AdmissionRequest, Long> {
    List<AdmissionRequest> findAllByOrderByCreatedAtDesc();
    long countByStatus(AdmissionStatus status);
    List<AdmissionRequest> findByCreatedAtAfterOrderByCreatedAtAsc(Instant since);
}
