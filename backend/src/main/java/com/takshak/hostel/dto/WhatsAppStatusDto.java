package com.takshak.hostel.dto;

public record WhatsAppStatusDto(
        boolean enabled,
        boolean configured,
        String message
) {
}
