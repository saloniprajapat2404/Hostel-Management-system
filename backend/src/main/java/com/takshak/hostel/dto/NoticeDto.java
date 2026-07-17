package com.takshak.hostel.dto;

import java.time.Instant;

public record NoticeDto(
        String id,
        String title,
        String body,
        String createdById,
        String createdByName,
        Instant createdAt,
        boolean active
) {
}
