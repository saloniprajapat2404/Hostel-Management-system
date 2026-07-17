package com.takshak.hostel.dto;

import com.takshak.hostel.entity.Notification;
import com.takshak.hostel.enums.NotificationType;
import java.time.Instant;

public record NotificationDto(
        Long id,
        String title,
        String message,
        NotificationType type,
        String linkPath,
        boolean read,
        Instant createdAt
) {
    public static NotificationDto from(Notification notification) {
        return new NotificationDto(
                notification.getId(),
                notification.getTitle(),
                notification.getMessage(),
                notification.getType(),
                notification.getLinkPath(),
                notification.isRead(),
                notification.getCreatedAt()
        );
    }
}
