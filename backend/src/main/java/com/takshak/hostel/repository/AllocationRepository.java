package com.takshak.hostel.repository;

import com.takshak.hostel.entity.Allocation;
import com.takshak.hostel.entity.User;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface AllocationRepository extends JpaRepository<Allocation, Long> {
    List<Allocation> findByActiveTrue();
    Optional<Allocation> findByStudentAndActiveTrue(User student);
    Optional<Allocation> findByBedIdAndActiveTrue(Long bedId);
    boolean existsByStudentAndActiveTrue(User student);

    @Query("""
            SELECT a FROM Allocation a
            JOIN FETCH a.student
            JOIN FETCH a.bed b
            JOIN FETCH b.room
            LEFT JOIN FETCH a.allocatedBy
            WHERE a.active = true
            ORDER BY a.allocatedAt DESC
            """)
    List<Allocation> findAllActiveDetailed();

    long countByActiveTrue();
}
