package com.takshak.hostel.repository;

import com.takshak.hostel.entity.Bed;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BedRepository extends JpaRepository<Bed, Long> {
    List<Bed> findByOccupiedFalse();
    long countByOccupiedTrue();
    long countByOccupiedFalse();

    @Query("SELECT b FROM Bed b JOIN FETCH b.room r ORDER BY r.roomNumber, b.bedLabel")
    List<Bed> findAllWithRoom();

    @Query("SELECT b FROM Bed b JOIN FETCH b.room WHERE b.id = :id")
    Optional<Bed> findByIdWithRoom(@Param("id") Long id);
}
