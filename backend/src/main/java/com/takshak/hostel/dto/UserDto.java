package com.takshak.hostel.dto;

import com.takshak.hostel.entity.User;
import com.takshak.hostel.enums.Role;
import java.time.Instant;
import java.util.Collections;
import java.util.Map;

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
        Instant createdAt,
        String branchId,
        Map<String, Boolean> screenPermissions,
        boolean accessGrant
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
                user.getCreatedAt(),
                user.getBranchId(),
                user.getScreenPermissions() != null
                        ? Collections.unmodifiableMap(user.getScreenPermissions())
                        : Map.of(),
                user.isAccessGrant());
    }

    public static UserDto summary(User user) {
        return from(user);
    }
}
