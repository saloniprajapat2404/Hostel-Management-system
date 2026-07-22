package com.takshak.hostel.dto;

import java.math.BigDecimal;
import java.util.List;

public record SuperAdminDashboardDto(
        long totalBranches,
        long totalStudents,
        BigDecimal totalRevenue,
        long totalOccupiedRooms,
        long totalAvailableRooms,
        long totalBeds,
        long occupiedBeds,
        List<BranchDashboardCardDto> branches
) {
}
