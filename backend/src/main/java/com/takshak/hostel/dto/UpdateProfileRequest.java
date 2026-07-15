package com.takshak.hostel.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateProfileRequest(
        @NotBlank String fullName,
        String phone
) {
}
