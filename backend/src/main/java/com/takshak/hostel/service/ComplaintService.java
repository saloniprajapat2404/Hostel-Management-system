package com.takshak.hostel.service;

import com.takshak.hostel.dto.ComplaintDto;
import com.takshak.hostel.dto.CreateComplaintRequest;
import com.takshak.hostel.dto.UpdateComplaintStatusRequest;
import com.takshak.hostel.entity.Complaint;
import com.takshak.hostel.entity.User;
import com.takshak.hostel.enums.ComplaintStatus;
import com.takshak.hostel.enums.NotificationType;
import com.takshak.hostel.enums.Role;
import com.takshak.hostel.exception.ApiException;
import com.takshak.hostel.repository.ComplaintRepository;
import com.takshak.hostel.repository.UserRepository;
import com.takshak.hostel.security.SecurityUtils;
import java.time.Instant;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class ComplaintService {

    private final ComplaintRepository complaintRepository;
    private final NotificationService notificationService;
    private final UserRepository userRepository;

    public ComplaintService(
            ComplaintRepository complaintRepository,
            NotificationService notificationService,
            UserRepository userRepository) {
        this.complaintRepository = complaintRepository;
        this.notificationService = notificationService;
        this.userRepository = userRepository;
    }

    public List<ComplaintDto> list() {
        User current = SecurityUtils.currentUser();
        if (current.getRole() == Role.STUDENT) {
            return complaintRepository.findByStudentIdOrderByCreatedAtDesc(current.getId()).stream()
                    .map(this::toDto)
                    .toList();
        }
        return complaintRepository.findAllByOrderByCreatedAtDesc().stream().map(this::toDto).toList();
    }

    public ComplaintDto create(CreateComplaintRequest request) {
        User student = SecurityUtils.currentUser();
        if (student.getRole() != Role.STUDENT) {
            throw new ApiException("Only students can file complaints", 403);
        }
        Complaint complaint = new Complaint();
        complaint.setStudentId(student.getId());
        complaint.setStudentName(student.getFullName());
        complaint.setTitle(request.title().trim());
        complaint.setDescription(request.description().trim());
        complaint.setStatus(ComplaintStatus.OPEN);
        Complaint saved = complaintRepository.save(complaint);
        notificationService.notifyRoles(
                List.of(Role.SUPER_ADMIN, Role.ADMIN, Role.WARDEN),
                "New complaint",
                student.getFullName() + ": " + saved.getTitle(),
                NotificationType.COMPLAINT,
                "/app/complaints");
        return toDto(saved);
    }

    public ComplaintDto updateStatus(String id, UpdateComplaintStatusRequest request) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new ApiException("Complaint not found", 404));
        User handler = SecurityUtils.currentUser();
        complaint.setStatus(request.status());
        complaint.setHandledById(handler.getId());
        complaint.setHandledByName(handler.getFullName());
        if (request.status() == ComplaintStatus.RESOLVED) {
            complaint.setResolvedAt(Instant.now());
        } else {
            complaint.setResolvedAt(null);
        }
        Complaint saved = complaintRepository.save(complaint);
        notificationService.notifyUser(
                userRepository.findById(saved.getStudentId()).orElse(null),
                "Complaint updated",
                saved.getTitle() + " is now " + saved.getStatus().name().replace('_', ' '),
                NotificationType.COMPLAINT,
                "/app/complaints");
        return toDto(saved);
    }

    private ComplaintDto toDto(Complaint c) {
        return new ComplaintDto(
                c.getId(),
                c.getStudentId(),
                c.getStudentName(),
                c.getTitle(),
                c.getDescription(),
                c.getStatus(),
                c.getCreatedAt(),
                c.getResolvedAt(),
                c.getHandledById(),
                c.getHandledByName()
        );
    }
}
