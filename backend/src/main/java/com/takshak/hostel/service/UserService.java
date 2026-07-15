package com.takshak.hostel.service;

import com.takshak.hostel.dto.CreateUserRequest;
import com.takshak.hostel.dto.UpdateProfileRequest;
import com.takshak.hostel.dto.UpdateUserRequest;
import com.takshak.hostel.dto.UserDto;
import com.takshak.hostel.entity.User;
import com.takshak.hostel.enums.Role;
import com.takshak.hostel.exception.ApiException;
import com.takshak.hostel.repository.UserRepository;
import com.takshak.hostel.security.SecurityUtils;
import java.util.List;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<UserDto> listUsers(Role roleFilter) {
        User current = SecurityUtils.currentUser();
        List<User> users;

        if (current.getRole() == Role.SUPER_ADMIN) {
            users = roleFilter != null ? userRepository.findByRole(roleFilter) : userRepository.findAll();
        } else if (current.getRole() == Role.ADMIN) {
            List<Role> allowed = List.of(Role.WARDEN, Role.STUDENT);
            if (roleFilter != null) {
                if (!allowed.contains(roleFilter)) {
                    throw new ApiException("Admin can only list WARDEN or STUDENT", 403);
                }
                users = userRepository.findByRole(roleFilter);
            } else {
                users = userRepository.findByRoleIn(allowed);
            }
        } else {
            throw new ApiException("Access denied", 403);
        }

        return users.stream().map(UserDto::from).toList();
    }

    @Transactional
    public UserDto createUser(CreateUserRequest request) {
        User current = SecurityUtils.currentUser();
        Role targetRole = request.role();

        if (current.getRole() == Role.SUPER_ADMIN) {
            if (targetRole != Role.ADMIN && targetRole != Role.WARDEN && targetRole != Role.STUDENT) {
                throw new ApiException("Super Admin can create ADMIN, WARDEN or STUDENT", 400);
            }
        } else if (current.getRole() == Role.ADMIN) {
            if (targetRole != Role.WARDEN) {
                throw new ApiException("Admin can only create WARDEN users", 403);
            }
        } else {
            throw new ApiException("Access denied", 403);
        }

        if (userRepository.existsByEmailIgnoreCase(request.email())) {
            throw new ApiException("Email already exists", 409);
        }
        if (request.studentId() != null && !request.studentId().isBlank()
                && userRepository.existsByStudentIdIgnoreCase(request.studentId())) {
            throw new ApiException("Student ID already exists", 409);
        }

        User user = new User();
        user.setEmail(request.email().trim().toLowerCase());
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setFullName(request.fullName().trim());
        user.setRole(targetRole);
        user.setStudentId(blankToNull(request.studentId()));
        user.setPhone(request.phone());
        user.setActive(true);
        return UserDto.from(userRepository.save(user));
    }

    @Transactional
    public UserDto updateUser(Long id, UpdateUserRequest request) {
        User current = SecurityUtils.currentUser();
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ApiException("User not found", 404));

        assertCanManage(current, user);

        if (request.email() != null && !request.email().isBlank()) {
            userRepository.findByEmailIgnoreCase(request.email())
                    .filter(u -> !u.getId().equals(id))
                    .ifPresent(u -> {
                        throw new ApiException("Email already exists", 409);
                    });
            user.setEmail(request.email().trim().toLowerCase());
        }
        if (request.password() != null && !request.password().isBlank()) {
            user.setPassword(passwordEncoder.encode(request.password()));
        }
        if (request.fullName() != null && !request.fullName().isBlank()) {
            user.setFullName(request.fullName().trim());
        }
        if (request.studentId() != null) {
            String sid = blankToNull(request.studentId());
            if (sid != null) {
                userRepository.findByStudentIdIgnoreCase(sid)
                        .filter(u -> !u.getId().equals(id))
                        .ifPresent(u -> {
                            throw new ApiException("Student ID already exists", 409);
                        });
            }
            user.setStudentId(sid);
        }
        if (request.phone() != null) {
            user.setPhone(request.phone());
        }
        if (request.active() != null) {
            user.setActive(request.active());
        }
        return UserDto.from(userRepository.save(user));
    }

    @Transactional
    public void deleteUser(Long id) {
        User current = SecurityUtils.currentUser();
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ApiException("User not found", 404));
        assertCanManage(current, user);
        user.setActive(false);
        userRepository.save(user);
    }

    @Transactional
    public UserDto updateOwnProfile(UpdateProfileRequest request) {
        User user = SecurityUtils.currentUser();
        user.setFullName(request.fullName().trim());
        user.setPhone(request.phone());
        return UserDto.from(userRepository.save(user));
    }

    public UserDto me() {
        return UserDto.from(SecurityUtils.currentUser());
    }

    public User requireStudent(Long studentId) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ApiException("Student not found", 404));
        if (student.getRole() != Role.STUDENT) {
            throw new ApiException("User is not a student", 400);
        }
        return student;
    }

    private void assertCanManage(User actor, User target) {
        if (actor.getRole() == Role.SUPER_ADMIN) {
            if (target.getRole() == Role.SUPER_ADMIN && !actor.getId().equals(target.getId())) {
                throw new ApiException("Cannot modify another Super Admin", 403);
            }
            return;
        }
        if (actor.getRole() == Role.ADMIN) {
            if (target.getRole() != Role.WARDEN && target.getRole() != Role.STUDENT) {
                throw new ApiException("Admin can only manage Wardens and Students", 403);
            }
            return;
        }
        throw new ApiException("Access denied", 403);
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
