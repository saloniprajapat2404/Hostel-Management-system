package com.takshak.hostel.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
        @NotBlank String fullName,
        String phone,
        String aadharNumber,
        @Size(max = 500_000, message = "Profile picture is too large")
        String profilePicture,
        @Size(max = 500) String addressLine,
        @Size(max = 100) String city,
        @Size(max = 100) String state,
        String pincode
) {
}
