package com.takshak.hostel.repository;

import com.takshak.hostel.entity.Notification;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface NotificationRepository extends MongoRepository<Notification, String> {
    List<Notification> findByUserIdOrderByCreatedAtDesc(String userId, Pageable pageable);

    long countByUserIdAndReadFalse(String userId);

    Optional<Notification> findByIdAndUserId(String id, String userId);

    List<Notification> findByUserIdAndReadFalse(String userId);
}
