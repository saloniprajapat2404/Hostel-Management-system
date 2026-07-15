package com.takshak.hostel.dto;

import java.time.Instant;

public record NoticeDto(
        Long id,
        String title,
        String body,
        Long createdById,
        String createdByName,
        Instant createdAt,
        boolean active
) {
}
