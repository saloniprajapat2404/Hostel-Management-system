package com.takshak.hostel.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateSettingRequest(
        @NotBlank String key,
        @NotBlank String value
) {
}
