package com.takshak.hostel.dto;

import java.math.BigDecimal;

public record BranchDashboardCardDto(
        String id,
        String name,
        String slug,
        String code,
        String city,
        long studentCount,
        long roomCount,
        long totalBeds,
        long occupiedBeds,
        BigDecimal revenue,
        double occupancyPercent
) {
}
