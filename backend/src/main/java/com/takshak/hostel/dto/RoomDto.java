package com.takshak.hostel.dto;

import com.takshak.hostel.enums.RoomGender;
import com.takshak.hostel.enums.RoomStatus;
import com.takshak.hostel.enums.RoomType;
import java.util.List;

public record RoomDto(
        String id,
        String roomNumber,
        int floor,
        int capacity,
        boolean active,
        String wing,
        RoomGender gender,
        RoomType roomType,
        RoomStatus status,
        String notes,
        List<BedDto> beds,
        long occupiedCount,
        long vacantCount,
        long maintenanceBedCount
) {
}
