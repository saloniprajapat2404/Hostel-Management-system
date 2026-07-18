package com.takshak.hostel.service;

import com.takshak.hostel.dto.NotificationDto;
import com.takshak.hostel.dto.NotificationSummaryDto;
import com.takshak.hostel.entity.Notification;
import com.takshak.hostel.entity.User;
import com.takshak.hostel.enums.NotificationType;
import com.takshak.hostel.enums.Role;
import com.takshak.hostel.exception.ApiException;
import com.takshak.hostel.repository.NotificationRepository;
import com.takshak.hostel.repository.UserRepository;
import com.takshak.hostel.security.SecurityUtils;
import java.time.Instant;
import java.util.List;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {

    private static final int LIST_LIMIT = 20;

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationService(
            NotificationRepository notificationRepository,
            UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    public NotificationSummaryDto summary() {
        User current = SecurityUtils.currentUser();
        long unread = notificationRepository.countByUserIdAndReadFalse(current.getId());
        List<NotificationDto> items = notificationRepository
                .findByUserIdOrderByCreatedAtDesc(current.getId(), PageRequest.of(0, LIST_LIMIT))
                .stream()
                .map(NotificationDto::from)
                .toList();
        return new NotificationSummaryDto(unread, items);
    }

    public NotificationDto markRead(String id) {
        User current = SecurityUtils.currentUser();
        Notification notification = notificationRepository.findByIdAndUserId(id, current.getId())
                .orElseThrow(() -> new ApiException("Notification not found", 404));
        notification.setRead(true);
        return NotificationDto.from(notificationRepository.save(notification));
    }

    public void markAllRead() {
        User current = SecurityUtils.currentUser();
        notificationRepository.findByUserIdAndReadFalse(current.getId()).forEach(notification -> {
            notification.setRead(true);
            notificationRepository.save(notification);
        });
    }

    public Notification create(
            User user,
            String title,
            String message,
            NotificationType type,
            String linkPath,
            Instant createdAt) {
        Notification notification = new Notification();
        notification.setUserId(user.getId());
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setType(type);
        notification.setLinkPath(linkPath);
        notification.setCreatedAt(createdAt != null ? createdAt : Instant.now());
        return notificationRepository.save(notification);
    }

    public void notifyRoles(
            List<Role> roles,
            String title,
            String message,
            NotificationType type,
            String linkPath) {
        userRepository.findByRoleIn(roles).stream()
                .filter(User::isActive)
                .forEach(user -> create(user, title, message, type, linkPath, null));
    }

    public void notifyUser(
            User user,
            String title,
            String message,
            NotificationType type,
            String linkPath) {
        if (user != null && user.isActive()) {
            create(user, title, message, type, linkPath, null);
        }
    }
}
