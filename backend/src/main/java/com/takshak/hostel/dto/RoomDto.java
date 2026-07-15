package com.takshak.hostel.dto;

import java.util.List;

public record RoomDto(
        Long id,
        String roomNumber,
        int floor,
        int capacity,
        boolean active,
        List<BedDto> beds,
        long occupiedCount,
        long vacantCount
) {
}
