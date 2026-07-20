package com.takshak.hostel.dto;

public record UpdateUserRequest(
        String email,
        String password,
        String fullName,
        String studentId,
        String phone,
        String whatsappNumber,
        String parentPhone,
        String aadharNumber,
        String addressLine,
        String city,
        String state,
        String pincode,
        Boolean active
) {
}
