package com.takshak.hostel.dto;

import com.takshak.hostel.enums.NoticeCategory;
import com.takshak.hostel.enums.NoticeStatus;
import com.takshak.hostel.enums.NoticeTargetAudience;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record UpdateNoticeRequest(
        @NotBlank String title,
        @NotBlank String description,
        @NotNull NoticeCategory category,
        @NotNull NoticeTargetAudience targetAudience,
        String roomNumber,
        String studentId,
        NoticeStatus status
) {
}
