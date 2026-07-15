package com.takshak.hostel.dto;

public record LoginResponse(String token, UserDto user) {
}
