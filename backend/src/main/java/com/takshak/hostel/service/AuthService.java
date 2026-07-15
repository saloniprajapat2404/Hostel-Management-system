package com.takshak.hostel.service;

import com.takshak.hostel.dto.LoginRequest;
import com.takshak.hostel.dto.LoginResponse;
import com.takshak.hostel.dto.UserDto;
import com.takshak.hostel.entity.User;
import com.takshak.hostel.exception.ApiException;
import com.takshak.hostel.repository.UserRepository;
import com.takshak.hostel.security.JwtService;
import com.takshak.hostel.security.UserPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByEmailIgnoreCase(request.identifier())
                .or(() -> userRepository.findByStudentIdIgnoreCase(request.identifier()))
                .orElseThrow(() -> new ApiException("Invalid credentials", 401));

        if (!user.isActive() || !passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new ApiException("Invalid credentials", 401);
        }

        UserPrincipal principal = new UserPrincipal(user);
        String token = jwtService.generateToken(principal);
        return new LoginResponse(token, UserDto.from(user));
    }
}
