package com.takshak.hostel.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateNoticeRequest(
        @NotBlank String title,
        @NotBlank String body
) {
}
