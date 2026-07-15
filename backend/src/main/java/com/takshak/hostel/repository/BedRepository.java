package com.takshak.hostel.repository;

import com.takshak.hostel.entity.Bed;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface BedRepository extends JpaRepository<Bed, Long> {
    List<Bed> findByOccupiedFalse();
    long countByOccupiedTrue();
    long countByOccupiedFalse();

    @Query("SELECT b FROM Bed b JOIN FETCH b.room r ORDER BY r.roomNumber, b.bedLabel")
    List<Bed> findAllWithRoom();
}
