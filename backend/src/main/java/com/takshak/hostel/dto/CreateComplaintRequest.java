package com.takshak.hostel.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateComplaintRequest(
        @NotBlank String title,
        @NotBlank String description
) {
}
