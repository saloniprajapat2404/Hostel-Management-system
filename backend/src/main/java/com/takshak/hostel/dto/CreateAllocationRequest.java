package com.takshak.hostel.dto;

import jakarta.validation.constraints.NotNull;

public record CreateAllocationRequest(
        @NotNull Long studentId,
        @NotNull Long bedId
) {
}
