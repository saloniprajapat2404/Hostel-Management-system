package com.takshak.hostel.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateAllocationRequest(
        @NotBlank String studentId,
        @NotBlank String bedId
) {
}
