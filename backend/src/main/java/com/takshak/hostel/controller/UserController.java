package com.takshak.hostel.controller;

import com.takshak.hostel.dto.CreateUserRequest;
import com.takshak.hostel.dto.StudentFeeDetailDto;
import com.takshak.hostel.dto.UpdateProfileRequest;
import com.takshak.hostel.dto.UpdateUserRequest;
import com.takshak.hostel.dto.UserDto;
import com.takshak.hostel.enums.Role;
import com.takshak.hostel.service.StudentFeeService;
import com.takshak.hostel.service.UserService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final StudentFeeService studentFeeService;

    public UserController(UserService userService, StudentFeeService studentFeeService) {
        this.userService = userService;
        this.studentFeeService = studentFeeService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','WARDEN')")
    public List<UserDto> list(@RequestParam(required = false) Role role) {
        return userService.listUsers(role);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public UserDto create(@Valid @RequestBody CreateUserRequest request) {
        return userService.createUser(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public UserDto update(@PathVariable Long id, @RequestBody UpdateUserRequest request) {
        return userService.updateUser(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public void delete(@PathVariable Long id) {
        userService.deleteUser(id);
    }

    @PutMapping("/me/profile")
    @PreAuthorize("isAuthenticated()")
    public UserDto updateProfile(@Valid @RequestBody UpdateProfileRequest request) {
        return userService.updateOwnProfile(request);
    }

    @GetMapping("/me/fees")
    @PreAuthorize("hasRole('STUDENT')")
    public List<StudentFeeDetailDto> myFees() {
        return studentFeeService.myFees();
    }
}
