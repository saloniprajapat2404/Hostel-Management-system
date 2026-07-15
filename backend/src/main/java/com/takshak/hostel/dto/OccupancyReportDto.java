package com.takshak.hostel.dto;

import java.util.List;

public record OccupancyReportDto(
        long totalRooms,
        long totalBeds,
        long occupiedBeds,
        long vacantBeds,
        double occupancyPercent,
        List<RoomDto> rooms
) {
}
