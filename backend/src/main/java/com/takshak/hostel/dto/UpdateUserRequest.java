package com.takshak.hostel.dto;

public record UpdateUserRequest(
        String email,
        String password,
        String fullName,
        String studentId,
        String phone,
        Boolean active
) {
}
