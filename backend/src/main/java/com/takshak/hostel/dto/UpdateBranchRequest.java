package com.takshak.hostel.dto;

import com.takshak.hostel.enums.BranchStatus;
import jakarta.validation.constraints.Size;

public record UpdateBranchRequest(
        @Size(max = 120) String name,
        @Size(max = 10) String code,
        @Size(max = 60) String slug,
        @Size(max = 80) String city,
        String address,
        String phone,
        String email,
        BranchStatus status
) {
}
