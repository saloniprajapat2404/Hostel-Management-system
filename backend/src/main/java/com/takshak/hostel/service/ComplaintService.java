package com.takshak.hostel.service;

import com.takshak.hostel.dto.ComplaintDto;
import com.takshak.hostel.dto.CreateComplaintRequest;
import com.takshak.hostel.dto.UpdateComplaintStatusRequest;
import com.takshak.hostel.entity.Complaint;
import com.takshak.hostel.entity.User;
import com.takshak.hostel.enums.ComplaintStatus;
import com.takshak.hostel.enums.Role;
import com.takshak.hostel.exception.ApiException;
import com.takshak.hostel.repository.ComplaintRepository;
import com.takshak.hostel.security.SecurityUtils;
import java.time.Instant;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ComplaintService {

    private final ComplaintRepository complaintRepository;

    public ComplaintService(ComplaintRepository complaintRepository) {
        this.complaintRepository = complaintRepository;
    }

    @Transactional(readOnly = true)
    public List<ComplaintDto> list() {
        User current = SecurityUtils.currentUser();
        if (current.getRole() == Role.STUDENT) {
            return complaintRepository.findByStudentOrderByCreatedAtDesc(current).stream()
                    .map(this::toDto)
                    .toList();
        }
        return complaintRepository.findAllDetailed().stream().map(this::toDto).toList();
    }

    @Transactional
    public ComplaintDto create(CreateComplaintRequest request) {
        User student = SecurityUtils.currentUser();
        if (student.getRole() != Role.STUDENT) {
            throw new ApiException("Only students can file complaints", 403);
        }
        Complaint complaint = new Complaint();
        complaint.setStudent(student);
        complaint.setTitle(request.title().trim());
        complaint.setDescription(request.description().trim());
        complaint.setStatus(ComplaintStatus.OPEN);
        return toDto(complaintRepository.save(complaint));
    }

    @Transactional
    public ComplaintDto updateStatus(Long id, UpdateComplaintStatusRequest request) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new ApiException("Complaint not found", 404));
        complaint.setStatus(request.status());
        complaint.setHandledBy(SecurityUtils.currentUser());
        if (request.status() == ComplaintStatus.RESOLVED) {
            complaint.setResolvedAt(Instant.now());
        } else {
            complaint.setResolvedAt(null);
        }
        return toDto(complaintRepository.save(complaint));
    }

    private ComplaintDto toDto(Complaint c) {
        User handledBy = c.getHandledBy();
        return new ComplaintDto(
                c.getId(),
                c.getStudent().getId(),
                c.getStudent().getFullName(),
                c.getTitle(),
                c.getDescription(),
                c.getStatus(),
                c.getCreatedAt(),
                c.getResolvedAt(),
                handledBy != null ? handledBy.getId() : null,
                handledBy != null ? handledBy.getFullName() : null
        );
    }
}
