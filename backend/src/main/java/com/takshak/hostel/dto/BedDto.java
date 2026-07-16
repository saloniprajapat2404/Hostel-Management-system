package com.takshak.hostel.dto;

public record BedDto(
        String id,
        String bedLabel,
        boolean occupied
) {
}
