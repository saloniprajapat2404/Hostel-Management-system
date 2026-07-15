package com.takshak.hostel.controller;

import com.takshak.hostel.dto.AdmissionRequestDto;
import com.takshak.hostel.dto.CreateAdmissionRequest;
import com.takshak.hostel.service.AdmissionService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admissions")
public class AdmissionController {

    private final AdmissionService admissionService;

    public AdmissionController(AdmissionService admissionService) {
        this.admissionService = admissionService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public List<AdmissionRequestDto> list() {
        return admissionService.list();
    }

    @PostMapping
    public AdmissionRequestDto create(@Valid @RequestBody CreateAdmissionRequest request) {
        return admissionService.create(request);
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public AdmissionRequestDto approve(@PathVariable Long id) {
        return admissionService.approve(id);
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public AdmissionRequestDto reject(@PathVariable Long id) {
        return admissionService.reject(id);
    }
}
