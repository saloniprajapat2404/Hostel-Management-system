package com.takshak.hostel.repository;

import com.takshak.hostel.entity.Notice;
import com.takshak.hostel.enums.NoticeStatus;
import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface NoticeRepository extends MongoRepository<Notice, String> {
    List<Notice> findByStatusOrderByCreatedAtDesc(NoticeStatus status);

    List<Notice> findAllByOrderByCreatedAtDesc();

    long countByStatus(NoticeStatus status);
}
