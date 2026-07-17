package com.takshak.hostel.dto;

import java.util.List;

public record NotificationSummaryDto(long unreadCount, List<NotificationDto> items) {
}
