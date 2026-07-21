package com.takshak.hostel.dto;

import com.takshak.hostel.enums.RoomGender;
import com.takshak.hostel.enums.RoomStatus;
import com.takshak.hostel.enums.RoomType;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record BulkCreateRoomsRequest(
        @NotBlank String prefix,
        @Min(1) int startNumber,
        @Min(1) @Max(50) int count,
        @Min(1) int padDigits,
        @Min(1) @Max(10) int floor,
        @Min(1) @Max(12) int capacity,
        String wing,
        RoomGender gender,
        RoomType roomType,
        RoomStatus status
) {
}
