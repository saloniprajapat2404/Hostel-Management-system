package com.takshak.hostel.repository;

import com.takshak.hostel.entity.Notice;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface NoticeRepository extends JpaRepository<Notice, Long> {
    List<Notice> findByActiveTrueOrderByCreatedAtDesc();

    @Query("""
            SELECT n FROM Notice n
            LEFT JOIN FETCH n.createdBy
            WHERE n.active = true
            ORDER BY n.createdAt DESC
            """)
    List<Notice> findActiveDetailed();
}
