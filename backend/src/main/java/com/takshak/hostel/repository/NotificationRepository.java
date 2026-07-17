package com.takshak.hostel.repository;

import com.takshak.hostel.entity.Notification;
import com.takshak.hostel.entity.User;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);

    long countByUserAndReadFalse(User user);

    Optional<Notification> findByIdAndUser(Long id, User user);

    List<Notification> findByUserAndReadFalse(User user);
}
