package com.takshak.hostel.controller;

import com.takshak.hostel.dto.BranchDto;
import com.takshak.hostel.dto.CreateBranchRequest;
import com.takshak.hostel.dto.SuperAdminDashboardDto;
import com.takshak.hostel.dto.UpdateBranchRequest;
import com.takshak.hostel.service.BranchService;
import com.takshak.hostel.service.SuperAdminDashboardService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/branches")
public class BranchController {

    private final BranchService branchService;

    public BranchController(BranchService branchService) {
        this.branchService = branchService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public List<BranchDto> list() {
        return branchService.list();
    }

    @GetMapping("/{idOrSlug}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public BranchDto get(@PathVariable String idOrSlug) {
        return branchService.getByIdOrSlug(idOrSlug);
    }

    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public BranchDto create(@Valid @RequestBody CreateBranchRequest request) {
        return branchService.create(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public BranchDto update(@PathVariable String id, @Valid @RequestBody UpdateBranchRequest request) {
        return branchService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id) {
        branchService.delete(id);
    }
}

@RestController
@RequestMapping("/api/superadmin")
class SuperAdminDashboardController {

    private final SuperAdminDashboardService superAdminDashboardService;

    SuperAdminDashboardController(SuperAdminDashboardService superAdminDashboardService) {
        this.superAdminDashboardService = superAdminDashboardService;
    }

    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public SuperAdminDashboardDto dashboard() {
        return superAdminDashboardService.dashboard();
    }
}
