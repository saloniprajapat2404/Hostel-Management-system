package com.takshak.hostel.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
        @NotBlank String fullName,
        @Pattern(regexp = "^$|\\d{10}", message = "Phone number must be exactly 10 digits") String phone,
        @Pattern(regexp = "^$|\\d{10}", message = "Parent mobile number must be exactly 10 digits") String parentPhone,
        String aadharNumber,
        @Size(max = 500_000, message = "Profile picture is too large")
        String profilePicture,
        @Size(max = 500) String addressLine,
        @Size(max = 100) String city,
        @Size(max = 100) String state,
        String pincode
) {
}
