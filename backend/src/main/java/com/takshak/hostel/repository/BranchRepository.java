package com.takshak.hostel.repository;

import com.takshak.hostel.entity.Branch;
import com.takshak.hostel.enums.BranchStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface BranchRepository extends MongoRepository<Branch, String> {
    Optional<Branch> findBySlug(String slug);
    Optional<Branch> findByCodeIgnoreCase(String code);
    boolean existsBySlug(String slug);
    boolean existsByCodeIgnoreCase(String code);
    List<Branch> findAllByOrderByNameAsc();
    List<Branch> findByStatusOrderByNameAsc(BranchStatus status);
    List<Branch> findByCityIgnoreCaseOrderByNameAsc(String city);
    boolean existsByCityIgnoreCaseAndNameIgnoreCase(String city, String name);
    Optional<Branch> findByCityIgnoreCaseAndNameIgnoreCase(String city, String name);
    long countByStatus(BranchStatus status);
    long countByCityIgnoreCase(String city);
    long countByCityIgnoreCaseAndStatus(String city, BranchStatus status);
}
