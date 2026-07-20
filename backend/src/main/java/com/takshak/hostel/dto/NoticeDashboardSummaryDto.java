package com.takshak.hostel.dto;

import java.util.List;

public record NoticeDashboardSummaryDto(
        long totalNotices,
        long activeNotices,
        long unreadCount,
        List<NoticeDto> latestNotices
) {
}
