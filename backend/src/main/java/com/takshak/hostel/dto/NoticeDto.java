package com.takshak.hostel.dto;

import com.takshak.hostel.enums.NoticeCategory;
import com.takshak.hostel.enums.NoticeStatus;
import com.takshak.hostel.enums.NoticeTargetAudience;
import java.time.Instant;
import java.util.List;

public record NoticeDto(
        String id,
        String title,
        String description,
        NoticeCategory category,
        NoticeTargetAudience targetAudience,
        String roomNumber,
        String studentId,
        String createdById,
        String createdByName,
        Instant createdAt,
        NoticeStatus status,
        Instant whatsappSentAt,
        boolean read
) {
}
