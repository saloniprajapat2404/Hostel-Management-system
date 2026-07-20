package com.takshak.hostel.dto;

import com.takshak.hostel.entity.User;
import com.takshak.hostel.enums.Role;
import java.time.Instant;

public record UserDto(
        String id,
        String email,
        String fullName,
        Role role,
        String studentId,
        String phone,
        String whatsappNumber,
        String parentPhone,
        String aadharNumber,
        String profilePicture,
        String addressLine,
        String city,
        String state,
        String pincode,
        boolean active,
        Instant createdAt
) {
    public static UserDto from(User user) {
        return new UserDto(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getRole(),
                user.getStudentId(),
                user.getPhone(),
                user.getWhatsappNumber(),
                user.getParentPhone(),
                user.getAadharNumber(),
                user.getProfilePicture(),
                user.getAddressLine(),
                user.getCity(),
                user.getState(),
                user.getPincode(),
                user.isActive(),
                user.getCreatedAt()
        );
    }

    public static UserDto summary(User user) {
        return from(user);
    }
}
