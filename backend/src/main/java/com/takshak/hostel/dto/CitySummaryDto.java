package com.takshak.hostel.dto;

public record CitySummaryDto(
        String city,
        String citySlug,
        long branchCount,
        long activeBranchCount
) {
}
