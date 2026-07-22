package com.takshak.hostel.dto;

import com.takshak.hostel.enums.BranchStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateBranchRequest(
        @NotBlank @Size(max = 120) String name,
        @NotBlank @Size(max = 10) String code,
        @NotBlank @Size(max = 60) String slug,
        @NotBlank @Size(max = 80) String city,
        String address,
        String phone,
        String email,
        BranchStatus status
) {
}
