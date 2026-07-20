package com.takshak.hostel.dto;

import com.takshak.hostel.enums.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateUserRequest(
        @NotBlank @Email String email,
        @NotBlank String password,
        @NotBlank String fullName,
        @NotNull Role role,
        String studentId,
        String phone,
        String whatsappNumber,
        String parentPhone,
        String aadharNumber,
        String addressLine,
        String city,
        String state,
        String pincode
) {
}
