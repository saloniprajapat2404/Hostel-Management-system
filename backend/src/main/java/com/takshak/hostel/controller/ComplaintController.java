package com.takshak.hostel.controller;

import com.takshak.hostel.dto.ComplaintDto;
import com.takshak.hostel.dto.CreateComplaintRequest;
import com.takshak.hostel.dto.UpdateComplaintStatusRequest;
import com.takshak.hostel.service.ComplaintService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/complaints")
public class ComplaintController {

    private final ComplaintService complaintService;

    public ComplaintController(ComplaintService complaintService) {
        this.complaintService = complaintService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','WARDEN','STUDENT')")
    public List<ComplaintDto> list() {
        return complaintService.list();
    }

    @PostMapping
    @PreAuthorize("hasRole('STUDENT')")
    public ComplaintDto create(@Valid @RequestBody CreateComplaintRequest request) {
        return complaintService.create(request);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','WARDEN')")
    public ComplaintDto updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateComplaintStatusRequest request) {
        return complaintService.updateStatus(id, request);
    }
}
