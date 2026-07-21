package com.takshak.hostel.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record CreateAdmissionRequest(
        @NotBlank String studentName,
        @NotBlank @Email String email,
        @NotBlank @Pattern(regexp = "\\d{10}", message = "Phone number must be exactly 10 digits") String phone,
        @NotBlank String studentId,
        String notes
) {
}
