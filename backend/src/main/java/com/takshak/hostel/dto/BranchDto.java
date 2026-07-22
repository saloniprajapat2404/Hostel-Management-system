package com.takshak.hostel.dto;

import com.takshak.hostel.entity.Branch;
import com.takshak.hostel.enums.BranchStatus;
import java.time.Instant;

public record BranchDto(
        String id,
        String name,
        String code,
        String slug,
        String city,
        String address,
        String phone,
        String email,
        BranchStatus status,
        Instant createdAt,
        Instant updatedAt
) {
    public static BranchDto from(Branch branch) {
        return new BranchDto(
                branch.getId(),
                branch.getName(),
                branch.getCode(),
                branch.getSlug(),
                branch.getCity(),
                branch.getAddress(),
                branch.getPhone(),
                branch.getEmail(),
                branch.getStatus(),
                branch.getCreatedAt(),
                branch.getUpdatedAt());
    }
}
