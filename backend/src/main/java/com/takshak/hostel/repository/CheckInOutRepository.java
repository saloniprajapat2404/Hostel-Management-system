package com.takshak.hostel.repository;

import com.takshak.hostel.entity.CheckInOut;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface CheckInOutRepository extends JpaRepository<CheckInOut, Long> {
    @Query("""
            SELECT c FROM CheckInOut c
            JOIN FETCH c.student
            LEFT JOIN FETCH c.recordedBy
            ORDER BY c.timestamp DESC
            """)
    List<CheckInOut> findAllDetailed();
}
