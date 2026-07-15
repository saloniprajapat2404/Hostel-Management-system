package com.takshak.hostel.dto;

public record UpdateRoomRequest(
        String roomNumber,
        Integer floor,
        Integer capacity,
        Boolean active
) {
}
