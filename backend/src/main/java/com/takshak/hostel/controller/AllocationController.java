package com.takshak.hostel.controller;

import com.takshak.hostel.dto.AllocationDto;
import com.takshak.hostel.dto.CreateAllocationRequest;
import com.takshak.hostel.service.AllocationService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/allocations")
public class AllocationController {

    private final AllocationService allocationService;

    public AllocationController(AllocationService allocationService) {
        this.allocationService = allocationService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','WARDEN')")
    public List<AllocationDto> list() {
        return allocationService.listAllocations();
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('STUDENT')")
    public AllocationDto me() {
        return allocationService.myAllocation();
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public AllocationDto allocate(@Valid @RequestBody CreateAllocationRequest request) {
        return allocationService.allocate(request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public void deallocate(@PathVariable String id) {
        allocationService.deallocate(id);
    }
}
