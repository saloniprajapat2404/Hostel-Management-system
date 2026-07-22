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
import com.takshak.hostel.security.BranchScope;
import com.takshak.hostel.security.ScreenPermissionService;
import com.takshak.hostel.security.SecurityUtils;
import com.takshak.hostel.util.PhoneUtils;
import java.util.List;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final AllocationRepository allocationRepository;
    private final BedRepository bedRepository;
    private final PasswordEncoder passwordEncoder;
    private final BranchScope branchScope;
    private final ScreenPermissionService screenPermissionService;

    public UserService(
            UserRepository userRepository,
            AllocationRepository allocationRepository,
            BedRepository bedRepository,
            PasswordEncoder passwordEncoder,
            BranchScope branchScope,
            ScreenPermissionService screenPermissionService) {
        this.userRepository = userRepository;
        this.allocationRepository = allocationRepository;
        this.bedRepository = bedRepository;
        this.passwordEncoder = passwordEncoder;
        this.branchScope = branchScope;
        this.screenPermissionService = screenPermissionService;
    }

    public List<UserDto> listUsers(Role roleFilter) {
        User current = SecurityUtils.currentUser();
        String branchId = branchScope.requireBranchId();
        List<User> users;

        if (current.getRole() == Role.SUPER_ADMIN) {
            if (roleFilter != null) {
                users = userRepository.findByRoleAndBranchId(roleFilter, branchId);
                if (roleFilter == Role.SUPER_ADMIN) {
                    users = userRepository.findByRole(Role.SUPER_ADMIN);
                }
            } else {
                users = userRepository.findByBranchId(branchId);
                users.addAll(userRepository.findByRole(Role.SUPER_ADMIN));
            }
        } else if (current.getRole() == Role.ADMIN) {
            List<Role> allowed = List.of(Role.ADMIN, Role.WARDEN, Role.STUDENT);
            if (roleFilter != null) {
                if (!allowed.contains(roleFilter)) {
                    throw new ApiException("Admin can only list ADMIN, WARDEN or STUDENT", 403);
                }
                users = userRepository.findByRoleAndBranchId(roleFilter, branchId);
            } else {
                users = userRepository.findByRoleInAndBranchId(allowed, branchId);
            }
        } else if (current.getRole() == Role.WARDEN) {
            if (roleFilter != null && roleFilter != Role.STUDENT) {
                throw new ApiException("Warden can only list STUDENT users", 403);
            }
            users = userRepository.findByRoleAndBranchId(Role.STUDENT, branchId);
        } else {
            throw new ApiException("Access denied", 403);
        }

        return users.stream().map(UserDto::from).toList();
    }

    public UserDto createUser(CreateUserRequest request) {
        User current = SecurityUtils.currentUser();
        Role targetRole = request.role();

        if (current.getRole() == Role.SUPER_ADMIN) {
            if (targetRole != Role.SUPER_ADMIN && targetRole != Role.ADMIN && targetRole != Role.WARDEN
                    && targetRole != Role.STUDENT) {
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
            User existing = userRepository.findByEmailIgnoreCase(request.email()).orElseThrow();
            if (targetRole == Role.SUPER_ADMIN || existing.getRole() == Role.SUPER_ADMIN) {
                throw new ApiException("Email already exists", 409);
            }
        }
        String branchId = targetRole == Role.SUPER_ADMIN ? null : branchScope.requireBranchId();
        if (branchId != null && userRepository.existsByEmailIgnoreCaseAndBranchId(request.email(), branchId)) {
            throw new ApiException("Email already exists in this branch", 409);
        }
        if (request.studentId() != null && !request.studentId().isBlank()) {
            if (userRepository.existsByStudentIdIgnoreCase(request.studentId())) {
                throw new ApiException("Student ID already exists", 409);
            }
            if (branchId != null
                    && userRepository.existsByStudentIdIgnoreCaseAndBranchId(request.studentId(), branchId)) {
                throw new ApiException("Student ID already exists in this branch", 409);
            }
        }

        User user = new User();
        user.setEmail(request.email().trim().toLowerCase());
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setFullName(request.fullName().trim());
        user.setRole(targetRole);
        user.setStudentId(blankToNull(request.studentId()));
        user.setPhone(PhoneUtils.requireMobile10(request.phone(), "Phone"));
        user.setWhatsappNumber(PhoneUtils.requireOptionalMobile10(request.whatsappNumber(), "WhatsApp number"));
        user.setParentPhone(PhoneUtils.requireMobile10(request.parentPhone(), "Parent mobile number"));
        applyRequiredProfileFields(user, request.aadharNumber(), request.addressLine(),
                request.city(), request.state(), request.pincode());
        boolean active = request.active() == null || Boolean.TRUE.equals(request.active());
        if (!active && current.getRole() != Role.SUPER_ADMIN && current.getRole() != Role.ADMIN) {
            throw new ApiException("Only Super Admin or Admin can create inactive users", 403);
        }
        user.setActive(active);
        user.setBranchId(branchId);
        user.setScreenPermissions(
                request.screenPermissions() != null && !request.screenPermissions().isEmpty()
                        ? screenPermissionService.mergeWithDefaults(request.screenPermissions())
                        : screenPermissionService.defaultPermissions());
        user.setAccessGrant(!Boolean.FALSE.equals(request.accessGrant()));
        return UserDto.from(userRepository.save(user));
    }

    public UserDto updateUser(String id, UpdateUserRequest request) {
        User current = SecurityUtils.currentUser();
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ApiException("User not found", 404));

        assertCanManage(current, user);
        assertSameBranch(current, user);

        if (request.email() != null && !request.email().isBlank()) {
            String email = request.email().trim().toLowerCase();
            userRepository.findByEmailIgnoreCase(email)
                    .filter(u -> !u.getId().equals(id))
                    .ifPresent(u -> {
                        throw new ApiException("Email already exists", 409);
                    });
            if (user.getBranchId() != null
                    && userRepository.existsByEmailIgnoreCaseAndBranchId(email, user.getBranchId())) {
                userRepository.findByEmailIgnoreCaseAndBranchId(email, user.getBranchId())
                        .filter(u -> !u.getId().equals(id))
                        .ifPresent(u -> {
                            throw new ApiException("Email already exists in this branch", 409);
                        });
            }
            user.setEmail(email);
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
                if (user.getBranchId() != null) {
                    userRepository.findByStudentIdIgnoreCaseAndBranchId(sid, user.getBranchId())
                            .filter(u -> !u.getId().equals(id))
                            .ifPresent(u -> {
                                throw new ApiException("Student ID already exists in this branch", 409);
                            });
                }
            }
            user.setStudentId(sid);
        }
        if (request.phone() != null) {
            user.setPhone(PhoneUtils.requireMobile10(request.phone(), "Phone"));
        }
        if (request.whatsappNumber() != null) {
            user.setWhatsappNumber(PhoneUtils.requireOptionalMobile10(request.whatsappNumber(), "WhatsApp number"));
        }
        if (request.parentPhone() != null) {
            user.setParentPhone(PhoneUtils.requireMobile10(request.parentPhone(), "Parent mobile number"));
        }
        if (request.aadharNumber() != null || request.addressLine() != null || request.city() != null
                || request.state() != null || request.pincode() != null) {
            applyRequiredProfileFields(
                    user,
                    request.aadharNumber() != null ? request.aadharNumber() : user.getAadharNumber(),
                    request.addressLine() != null ? request.addressLine() : user.getAddressLine(),
                    request.city() != null ? request.city() : user.getCity(),
                    request.state() != null ? request.state() : user.getState(),
                    request.pincode() != null ? request.pincode() : user.getPincode());
        }
        if (request.active() != null) {
            if (current.getRole() != Role.SUPER_ADMIN && current.getRole() != Role.ADMIN) {
                throw new ApiException("Only Super Admin or Admin can change account status", 403);
            }
            user.setActive(request.active());
        }
        if (request.screenPermissions() != null) {
            user.setScreenPermissions(
                    request.screenPermissions().isEmpty()
                            ? screenPermissionService.defaultPermissions()
                            : screenPermissionService.mergeWithDefaults(request.screenPermissions()));
        }
        if (request.accessGrant() != null) {
            user.setAccessGrant(request.accessGrant());
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
        assertSameBranch(current, user);
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
        user.setPhone(PhoneUtils.requireMobile10(request.phone(), "Phone"));
        user.setProfilePicture(blankToNull(request.profilePicture()));
        applyRequiredProfileFields(
                user,
                request.aadharNumber(),
                request.addressLine(),
                request.city(),
                request.state(),
                request.pincode());
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
        User current = SecurityUtils.currentUser();
        if (current.getRole() != Role.SUPER_ADMIN
                && student.getBranchId() != null
                && !student.getBranchId().equals(branchScope.requireBranchId())) {
            throw new ApiException("Student not found", 404);
        }
        return student;
    }

    private void assertSameBranch(User actor, User target) {
        if (actor.getRole() == Role.SUPER_ADMIN || target.getRole() == Role.SUPER_ADMIN) {
            return;
        }
        String branchId = branchScope.requireBranchId();
        if (target.getBranchId() == null || !target.getBranchId().equals(branchId)) {
            throw new ApiException("Access denied", 403);
        }
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
            if (target.getRole() == Role.ADMIN) {
                throw new ApiException("Admin cannot edit or delete other admins", 403);
            }
            if (target.getRole() != Role.WARDEN && target.getRole() != Role.STUDENT) {
                throw new ApiException("Access denied", 403);
            }
            return;
        }
        throw new ApiException("Access denied", 403);
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private void applyRequiredProfileFields(
            User user,
            String aadharNumber,
            String addressLine,
            String city,
            String state,
            String pincode) {
        String aadhar = digitsOnly(aadharNumber);
        if (aadhar == null || aadhar.length() != 12) {
            throw new ApiException("Aadhar number is required and must be 12 digits", 400);
        }
        user.setAadharNumber(aadhar);

        String line = blankToNull(addressLine);
        if (line == null) {
            throw new ApiException("Address line is required", 400);
        }
        user.setAddressLine(line);

        String cityValue = blankToNull(city);
        if (cityValue == null) {
            throw new ApiException("City is required", 400);
        }
        user.setCity(cityValue);

        String stateValue = blankToNull(state);
        if (stateValue == null) {
            throw new ApiException("State is required", 400);
        }
        user.setState(stateValue);

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
