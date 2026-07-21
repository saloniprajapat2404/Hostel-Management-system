package com.takshak.hostel.service;

import com.takshak.hostel.dto.CreateUserRequest;
import com.takshak.hostel.dto.UpdateProfileRequest;
import com.takshak.hostel.dto.UpdateUserRequest;
import com.takshak.hostel.dto.UserDto;
import com.takshak.hostel.entity.User;
import com.takshak.hostel.enums.Role;
import com.takshak.hostel.exception.ApiException;
import com.takshak.hostel.repository.AllocationRepository;
import com.takshak.hostel.repository.BedRepository;
import com.takshak.hostel.repository.UserRepository;
import com.takshak.hostel.security.SecurityUtils;
import java.util.List;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final AllocationRepository allocationRepository;
    private final BedRepository bedRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(
            UserRepository userRepository,
            AllocationRepository allocationRepository,
            BedRepository bedRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.allocationRepository = allocationRepository;
        this.bedRepository = bedRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<UserDto> listUsers(Role roleFilter) {
        User current = SecurityUtils.currentUser();
        List<User> users;

        if (current.getRole() == Role.SUPER_ADMIN) {
            users = roleFilter != null ? userRepository.findByRole(roleFilter) : userRepository.findAll();
        } else if (current.getRole() == Role.ADMIN) {
            List<Role> allowed = List.of(Role.ADMIN, Role.WARDEN, Role.STUDENT);
            if (roleFilter != null) {
                if (!allowed.contains(roleFilter)) {
                    throw new ApiException("Admin can only list ADMIN, WARDEN or STUDENT", 403);
                }
                users = userRepository.findByRole(roleFilter);
            } else {
                users = userRepository.findByRoleIn(allowed);
            }
        } else if (current.getRole() == Role.WARDEN) {
            if (roleFilter != null && roleFilter != Role.STUDENT) {
                throw new ApiException("Warden can only list STUDENT users", 403);
            }
            users = userRepository.findByRole(Role.STUDENT);
        } else {
            throw new ApiException("Access denied", 403);
        }

        return users.stream().map(UserDto::from).toList();
    }

    public UserDto createUser(CreateUserRequest request) {
        User current = SecurityUtils.currentUser();
        Role targetRole = request.role();

        if (current.getRole() == Role.SUPER_ADMIN) {
            if (targetRole != Role.SUPER_ADMIN && targetRole != Role.ADMIN
                    && targetRole != Role.WARDEN && targetRole != Role.STUDENT) {
                throw new ApiException("Super Admin can only create SUPER_ADMIN, ADMIN, WARDEN or STUDENT users", 400);
            }
        } else if (current.getRole() == Role.ADMIN) {
            if (targetRole != Role.WARDEN && targetRole != Role.STUDENT) {
                throw new ApiException("Admin can only create WARDEN or STUDENT users", 400);
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
        user.setWhatsappNumber(blankToNull(request.whatsappNumber()));
        user.setParentPhone(blankToNull(request.parentPhone()));
        applyStudentProfileFields(user, request.aadharNumber(), request.addressLine(),
                request.city(), request.state(), request.pincode());
        boolean active = request.active() == null || Boolean.TRUE.equals(request.active());
        if (!active && current.getRole() != Role.SUPER_ADMIN && current.getRole() != Role.ADMIN) {
            throw new ApiException("Only Super Admin or Admin can create inactive users", 403);
        }
        user.setActive(active);
        return UserDto.from(userRepository.save(user));
    }

    public UserDto updateUser(String id, UpdateUserRequest request) {
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
        if (request.whatsappNumber() != null) {
            user.setWhatsappNumber(blankToNull(request.whatsappNumber()));
        }
        if (request.parentPhone() != null) {
            user.setParentPhone(blankToNull(request.parentPhone()));
        }
        if (request.aadharNumber() != null) {
            String aadhar = digitsOnly(request.aadharNumber());
            if (aadhar != null && aadhar.length() != 12) {
                throw new ApiException("Aadhar number must be 12 digits", 400);
            }
            user.setAadharNumber(aadhar);
        }
        if (request.addressLine() != null) {
            user.setAddressLine(blankToNull(request.addressLine()));
        }
        if (request.city() != null) {
            user.setCity(blankToNull(request.city()));
        }
        if (request.state() != null) {
            user.setState(blankToNull(request.state()));
        }
        if (request.pincode() != null) {
            String pincode = digitsOnly(request.pincode());
            if (pincode != null && pincode.length() != 6) {
                throw new ApiException("Pincode must be 6 digits", 400);
            }
            user.setPincode(pincode);
        }
        if (request.active() != null) {
            if (current.getRole() != Role.SUPER_ADMIN && current.getRole() != Role.ADMIN) {
                throw new ApiException("Only Super Admin or Admin can change account status", 403);
            }
            user.setActive(request.active());
        }
        return UserDto.from(userRepository.save(user));
    }

    public void deleteUser(String id) {
        User current = SecurityUtils.currentUser();
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ApiException("User not found", 404));
        if (user.getId().equals(current.getId())) {
            throw new ApiException("You cannot delete your own account", 400);
        }
        assertCanManage(current, user);
        releaseActiveAllocation(user);
        user.setActive(false);
        userRepository.save(user);
    }

    private void releaseActiveAllocation(User user) {
        allocationRepository.findByStudentIdAndActiveTrue(user.getId()).ifPresent(allocation -> {
            allocation.setActive(false);
            if (allocation.getBedId() != null) {
                bedRepository.setOccupied(allocation.getBedId(), false);
            }
            allocationRepository.save(allocation);
        });
    }

    public UserDto updateOwnProfile(UpdateProfileRequest request) {
        User user = SecurityUtils.currentUser();
        user.setFullName(request.fullName().trim());
        user.setPhone(blankToNull(request.phone()));

        String aadhar = digitsOnly(request.aadharNumber());
        if (aadhar != null && aadhar.length() != 12) {
            throw new ApiException("Aadhar number must be 12 digits", 400);
        }
        user.setAadharNumber(aadhar);

        user.setProfilePicture(blankToNull(request.profilePicture()));
        user.setAddressLine(blankToNull(request.addressLine()));
        user.setCity(blankToNull(request.city()));
        user.setState(blankToNull(request.state()));

        String pincode = digitsOnly(request.pincode());
        if (pincode != null && pincode.length() != 6) {
            throw new ApiException("Pincode must be 6 digits", 400);
        }
        user.setPincode(pincode);

        return UserDto.from(userRepository.save(user));
    }

    public UserDto me() {
        return UserDto.from(SecurityUtils.currentUser());
    }

    public User requireStudent(String studentId) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ApiException("Student not found", 404));
        if (student.getRole() != Role.STUDENT) {
            throw new ApiException("User is not a student", 400);
        }
        if (!student.isActive()) {
            throw new ApiException("Student is inactive", 400);
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
            if (target.getRole() == Role.SUPER_ADMIN) {
                throw new ApiException("Access denied", 403);
            }
            if (target.getRole() != Role.ADMIN && target.getRole() != Role.WARDEN && target.getRole() != Role.STUDENT) {
                throw new ApiException("Access denied", 403);
            }
            return;
        }
        throw new ApiException("Access denied", 403);
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private void applyStudentProfileFields(
            User user,
            String aadharNumber,
            String addressLine,
            String city,
            String state,
            String pincode) {
        String aadhar = digitsOnly(aadharNumber);
        if (aadhar != null && aadhar.length() != 12) {
            throw new ApiException("Aadhar number must be 12 digits", 400);
        }
        user.setAadharNumber(aadhar);
        user.setAddressLine(blankToNull(addressLine));
        user.setCity(blankToNull(city));
        user.setState(blankToNull(state));
        String pin = digitsOnly(pincode);
        if (pin != null && pin.length() != 6) {
            throw new ApiException("Pincode must be 6 digits", 400);
        }
        user.setPincode(pin);
    }

    private String digitsOnly(String value) {
        if (value == null || value.isBlank()) return null;
        return value.replaceAll("\\D", "");
    }
}
