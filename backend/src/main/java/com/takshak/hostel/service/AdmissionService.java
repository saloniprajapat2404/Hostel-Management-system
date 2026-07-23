package com.takshak.hostel.service;

import com.takshak.hostel.dto.AdmissionRequestDto;
import com.takshak.hostel.dto.CreateAdmissionRequest;
import com.takshak.hostel.entity.AdmissionRequest;
import com.takshak.hostel.entity.User;
import com.takshak.hostel.enums.AdmissionStatus;
import com.takshak.hostel.enums.NotificationType;
import com.takshak.hostel.enums.Role;
import com.takshak.hostel.exception.ApiException;
import com.takshak.hostel.repository.AdmissionRequestRepository;
import com.takshak.hostel.repository.BranchRepository;
import com.takshak.hostel.repository.UserRepository;
import com.takshak.hostel.security.BranchScope;
import com.takshak.hostel.security.SecurityUtils;
import com.takshak.hostel.util.PhoneUtils;
import java.time.Instant;
import java.util.List;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AdmissionService {

    private final AdmissionRequestRepository admissionRequestRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final NotificationService notificationService;
    private final BranchScope branchScope;
    private final BranchRepository branchRepository;

    public AdmissionService(
            AdmissionRequestRepository admissionRequestRepository,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            NotificationService notificationService,
            BranchScope branchScope,
            BranchRepository branchRepository) {
        this.admissionRequestRepository = admissionRequestRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.notificationService = notificationService;
        this.branchScope = branchScope;
        this.branchRepository = branchRepository;

    }

    public List<AdmissionRequestDto> list() {
        String branchId = branchScope.requireBranchId();
        return admissionRequestRepository.findByBranchIdOrderByCreatedAtDesc(branchId).stream()
                .map(this::toDto)
                .toList();
    }

    public AdmissionRequestDto create(CreateAdmissionRequest request) {
        AdmissionRequest entity = new AdmissionRequest();
        entity.setStudentName(request.studentName().trim());
        entity.setEmail(request.email().trim().toLowerCase());
        entity.setPhone(PhoneUtils.requireMobile10(request.phone(), "Phone"));
        entity.setStudentId(request.studentId().trim().toUpperCase());
        entity.setNotes(request.notes());
        entity.setStatus(AdmissionStatus.PENDING);
        entity.setBranchId(resolveDefaultBranchId());
        AdmissionRequest saved = admissionRequestRepository.save(entity);
        notificationService.notifyRoles(
                List.of(Role.SUPER_ADMIN, Role.ADMIN),
                "New admission request",
                saved.getStudentName() + " submitted an admission request",
                NotificationType.ADMISSION,
                "/app/admissions");
        return toDto(saved);
    }

    public AdmissionRequestDto approve(String id) {
        AdmissionRequest request = getPending(id, branchScope.requireBranchId());
        User reviewer = SecurityUtils.currentUser();

        User student = userRepository.findByEmailIgnoreCase(request.getEmail())
                .or(() -> userRepository.findByStudentIdIgnoreCase(request.getStudentId()))
                .orElseGet(() -> {
                    User u = new User();
                    u.setEmail(request.getEmail());
                    u.setPassword(passwordEncoder.encode("demo123"));
                    u.setFullName(request.getStudentName());
                    u.setRole(Role.STUDENT);
                    u.setStudentId(request.getStudentId());
                    u.setPhone(request.getPhone());
                    u.setActive(true);
                    u.setBranchId(request.getBranchId());
                    return userRepository.save(u);
                });

        if (student.getRole() != Role.STUDENT) {
            throw new ApiException("Existing user with this email is not a student", 409);
        }
        if (!student.isActive()) {
            student.setActive(true);
            userRepository.save(student);
        }

        request.setStatus(AdmissionStatus.APPROVED);
        request.setReviewedById(reviewer.getId());
        request.setReviewedByName(reviewer.getFullName());
        request.setReviewedAt(Instant.now());
        return toDto(admissionRequestRepository.save(request));
    }

    public AdmissionRequestDto reject(String id) {
        AdmissionRequest request = getPending(id, branchScope.requireBranchId());
        User reviewer = SecurityUtils.currentUser();
        request.setStatus(AdmissionStatus.REJECTED);
        request.setReviewedById(reviewer.getId());
        request.setReviewedByName(reviewer.getFullName());
        request.setReviewedAt(Instant.now());
        return toDto(admissionRequestRepository.save(request));
    }

    private AdmissionRequest getPending(String id, String branchId) {
        AdmissionRequest request = admissionRequestRepository.findById(id)
                .orElseThrow(() -> new ApiException("Admission request not found", 404));
        if (request.getBranchId() == null || !request.getBranchId().equals(branchId)) {
            throw new ApiException("Admission request not found", 404);
        }
        if (request.getStatus() != AdmissionStatus.PENDING) {
            throw new ApiException("Admission request is not pending", 400);
        }
        return request;
    }

    private String resolveDefaultBranchId() {
        return branchScope.optionalBranchId()
                .or(() -> branchRepository.findBySlug("vijay-nagar").map(b -> b.getId()))
                .or(() -> branchRepository.findAllByOrderByNameAsc().stream().findFirst().map(b -> b.getId()))
                .orElseThrow(() -> new ApiException("No branch configured", 500));
    }

    private AdmissionRequestDto toDto(AdmissionRequest a) {
        return new AdmissionRequestDto(
                a.getId(),
                a.getStudentName(),
                a.getEmail(),
                a.getPhone(),
                a.getStudentId(),
                a.getStatus(),
                a.getNotes(),
                a.getCreatedAt(),
                a.getReviewedById(),
                a.getReviewedByName(),
                a.getReviewedAt()
        );
    }
}
