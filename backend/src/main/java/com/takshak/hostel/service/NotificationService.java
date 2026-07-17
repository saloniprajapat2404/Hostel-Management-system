package com.takshak.hostel.service;

import com.takshak.hostel.dto.NotificationDto;
import com.takshak.hostel.dto.NotificationSummaryDto;
import com.takshak.hostel.entity.Notification;
import com.takshak.hostel.entity.User;
import com.takshak.hostel.enums.NotificationType;
import com.takshak.hostel.exception.ApiException;
import com.takshak.hostel.repository.NotificationRepository;
import com.takshak.hostel.security.SecurityUtils;
import java.time.Instant;
import java.util.List;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NotificationService {

    private static final int LIST_LIMIT = 20;

    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @Transactional(readOnly = true)
    public NotificationSummaryDto summary() {
        User current = SecurityUtils.currentUser();
        long unread = notificationRepository.countByUserAndReadFalse(current);
        List<NotificationDto> items = notificationRepository
                .findByUserOrderByCreatedAtDesc(current, PageRequest.of(0, LIST_LIMIT))
                .stream()
                .map(NotificationDto::from)
                .toList();
        return new NotificationSummaryDto(unread, items);
    }

    @Transactional
    public NotificationDto markRead(Long id) {
        User current = SecurityUtils.currentUser();
        Notification notification = notificationRepository.findByIdAndUser(id, current)
                .orElseThrow(() -> new ApiException("Notification not found", 404));
        notification.setRead(true);
        return NotificationDto.from(notificationRepository.save(notification));
    }

    @Transactional
    public void markAllRead() {
        User current = SecurityUtils.currentUser();
        notificationRepository.findByUserAndReadFalse(current).forEach(notification -> {
            notification.setRead(true);
            notificationRepository.save(notification);
        });
    }

    @Transactional
    public Notification create(
            User user,
            String title,
            String message,
            NotificationType type,
            String linkPath,
            Instant createdAt) {
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setType(type);
        notification.setLinkPath(linkPath);
        notification.setCreatedAt(createdAt != null ? createdAt : Instant.now());
        return notificationRepository.save(notification);
    }
}
