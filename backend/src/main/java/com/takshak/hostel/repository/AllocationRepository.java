package com.takshak.hostel.repository;

import com.takshak.hostel.entity.Allocation;
import java.util.List;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface AllocationRepository extends MongoRepository<Allocation, String> {
    List<Allocation> findByActiveTrue();
    Optional<Allocation> findByStudentIdAndActiveTrue(String studentId);
    Optional<Allocation> findByBedIdAndActiveTrue(String bedId);
    boolean existsByStudentIdAndActiveTrue(String studentId);
    List<Allocation> findByActiveTrueOrderByAllocatedAtDesc();
    long countByActiveTrue();
    List<Allocation> findByRoomNumberIgnoreCaseAndActiveTrue(String roomNumber);
}
