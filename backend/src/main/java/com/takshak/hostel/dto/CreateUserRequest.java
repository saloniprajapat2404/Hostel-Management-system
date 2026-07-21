package com.takshak.hostel.dto;

import com.takshak.hostel.enums.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public record CreateUserRequest(
        @NotBlank @Email String email,
        @NotBlank String password,
        @NotBlank String fullName,
        @NotNull Role role,
        String studentId,
        @NotBlank @Pattern(regexp = "\\d{10}", message = "Phone number must be exactly 10 digits") String phone,
        @Pattern(regexp = "^$|\\d{10}", message = "WhatsApp number must be exactly 10 digits") String whatsappNumber,
        @Pattern(regexp = "^$|\\d{10}", message = "Parent mobile number must be exactly 10 digits") String parentPhone,
        String aadharNumber,
        String addressLine,
        String city,
        String state,
        String pincode
) {
}
