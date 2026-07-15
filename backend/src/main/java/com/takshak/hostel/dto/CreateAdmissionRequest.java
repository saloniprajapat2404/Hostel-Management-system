package com.takshak.hostel.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record CreateAdmissionRequest(
        @NotBlank String studentName,
        @NotBlank @Email String email,
        String phone,
        @NotBlank String studentId,
        String notes
) {
}
