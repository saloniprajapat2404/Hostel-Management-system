package com.takshak.hostel.dto;

import jakarta.validation.constraints.NotBlank;

public record SendWhatsAppRequest(
        @NotBlank String noticeId
) {
}
