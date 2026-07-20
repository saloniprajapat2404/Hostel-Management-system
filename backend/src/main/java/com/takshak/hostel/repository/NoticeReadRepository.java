package com.takshak.hostel.repository;

import com.takshak.hostel.entity.NoticeRead;
import java.util.List;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface NoticeReadRepository extends MongoRepository<NoticeRead, String> {
    List<NoticeRead> findByUserId(String userId);

    Optional<NoticeRead> findByUserIdAndNoticeId(String userId, String noticeId);

    boolean existsByUserIdAndNoticeId(String userId, String noticeId);
}
