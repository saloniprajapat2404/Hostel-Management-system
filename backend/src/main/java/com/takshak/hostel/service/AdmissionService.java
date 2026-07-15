package com.takshak.hostel.service;

import com.takshak.hostel.dto.AdmissionRequestDto;
import com.takshak.hostel.dto.CreateAdmissionRequest;
import com.takshak.hostel.entity.AdmissionRequest;
import com.takshak.hostel.entity.User;
import com.takshak.hostel.enums.AdmissionStatus;
import com.takshak.hostel.enums.Role;
import com.takshak.hostel.exception.ApiException;
import com.takshak.hostel.repository.AdmissionRequestRepository;
import com.takshak.hostel.repository.UserRepository;
import com.takshak.hostel.security.SecurityUtils;
import java.time.Instant;
import java.util.List;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdmissionService {

    private final AdmissionRequestRepository admissionRequestRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AdmissionService(
            AdmissionRequestRepository admissionRequestRepository,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder) {
        this.admissionRequestRepository = admissionRequestRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public List<AdmissionRequestDto> list() {
        return admissionRequestRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public AdmissionRequestDto create(CreateAdmissionRequest request) {
        AdmissionRequest entity = new AdmissionRequest();
        entity.setStudentName(request.studentName().trim());
        entity.setEmail(request.email().trim().toLowerCase());
        entity.setPhone(request.phone());
        entity.setStudentId(request.studentId().trim().toUpperCase());
        entity.setNotes(request.notes());
        entity.setStatus(AdmissionStatus.PENDING);
        return toDto(admissionRequestRepository.save(entity));
    }

    @Transactional
    public AdmissionRequestDto approve(Long id) {
        AdmissionRequest request = getPending(id);
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
        request.setReviewedBy(reviewer);
        request.setReviewedAt(Instant.now());
        return toDto(admissionRequestRepository.save(request));
    }

    @Transactional
    public AdmissionRequestDto reject(Long id) {
        AdmissionRequest request = getPending(id);
        request.setStatus(AdmissionStatus.REJECTED);
        request.setReviewedBy(SecurityUtils.currentUser());
        request.setReviewedAt(Instant.now());
        return toDto(admissionRequestRepository.save(request));
    }

    private AdmissionRequest getPending(Long id) {
        AdmissionRequest request = admissionRequestRepository.findById(id)
                .orElseThrow(() -> new ApiException("Admission request not found", 404));
        if (request.getStatus() != AdmissionStatus.PENDING) {
            throw new ApiException("Admission request is not pending", 400);
        }
        return request;
    }

    private AdmissionRequestDto toDto(AdmissionRequest a) {
        User reviewer = a.getReviewedBy();
        return new AdmissionRequestDto(
                a.getId(),
                a.getStudentName(),
                a.getEmail(),
                a.getPhone(),
                a.getStudentId(),
                a.getStatus(),
                a.getNotes(),
                a.getCreatedAt(),
                reviewer != null ? reviewer.getId() : null,
                reviewer != null ? reviewer.getFullName() : null,
                a.getReviewedAt()
        );
    }
}
