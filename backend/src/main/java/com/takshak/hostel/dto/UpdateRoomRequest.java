package com.takshak.hostel.dto;

import com.takshak.hostel.enums.RoomGender;
import com.takshak.hostel.enums.RoomStatus;
import com.takshak.hostel.enums.RoomType;

public record UpdateRoomRequest(
        String roomNumber,
        Integer floor,
        Integer capacity,
        Boolean active,
        String wing,
        RoomGender gender,
        RoomType roomType,
        RoomStatus status,
        String notes
) {
}
