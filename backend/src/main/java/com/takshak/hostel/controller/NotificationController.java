package com.takshak.hostel.controller;

import com.takshak.hostel.dto.NotificationDto;
import com.takshak.hostel.dto.NotificationSummaryDto;
import com.takshak.hostel.service.NotificationService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/notifications")
@PreAuthorize("isAuthenticated()")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public NotificationSummaryDto summary() {
        return notificationService.summary();
    }

    @PatchMapping("/{id}/read")
    public NotificationDto markRead(@PathVariable Long id) {
        return notificationService.markRead(id);
    }

    @PatchMapping("/read-all")
    public void markAllRead() {
        notificationService.markAllRead();
    }
}
