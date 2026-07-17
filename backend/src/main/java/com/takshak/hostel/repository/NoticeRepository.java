package com.takshak.hostel.repository;

import com.takshak.hostel.entity.Notice;
import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface NoticeRepository extends MongoRepository<Notice, String> {
    List<Notice> findByActiveTrueOrderByCreatedAtDesc();
}
