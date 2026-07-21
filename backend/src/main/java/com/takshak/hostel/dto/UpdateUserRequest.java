package com.takshak.hostel.dto;

import jakarta.validation.constraints.Pattern;

public record UpdateUserRequest(
        String email,
        String password,
        String fullName,
        String studentId,
        @Pattern(regexp = "^$|\\d{10}", message = "Phone number must be exactly 10 digits") String phone,
        @Pattern(regexp = "^$|\\d{10}", message = "WhatsApp number must be exactly 10 digits") String whatsappNumber,
        @Pattern(regexp = "^$|\\d{10}", message = "Parent mobile number must be exactly 10 digits") String parentPhone,
        String aadharNumber,
        String addressLine,
        String city,
        String state,
        String pincode,
        Boolean active
) {
}
