package com.takshak.hostel.repository;

import com.takshak.hostel.entity.AdmissionRequest;
import com.takshak.hostel.enums.AdmissionStatus;
import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface AdmissionRequestRepository extends MongoRepository<AdmissionRequest, String> {
    List<AdmissionRequest> findAllByOrderByCreatedAtDesc();
    long countByStatus(AdmissionStatus status);
}
