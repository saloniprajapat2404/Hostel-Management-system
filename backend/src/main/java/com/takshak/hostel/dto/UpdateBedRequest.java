package com.takshak.hostel.dto;

public record UpdateBedRequest(
        Boolean underMaintenance,
        String bedLabel
) {
}
