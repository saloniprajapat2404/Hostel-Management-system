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

@Service
public class ComplaintService {

    private final ComplaintRepository complaintRepository;

    public ComplaintService(ComplaintRepository complaintRepository) {
        this.complaintRepository = complaintRepository;
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
        return toDto(complaintRepository.save(complaint));
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
        return toDto(complaintRepository.save(complaint));
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
