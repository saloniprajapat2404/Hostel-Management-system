package com.takshak.hostel.dto;

public record BedDto(
        Long id,
        String bedLabel,
        boolean occupied
) {
}
