package com.takshak.hostel.service;

import com.takshak.hostel.dto.AllocationDto;
import com.takshak.hostel.dto.CreateAllocationRequest;
import com.takshak.hostel.entity.Allocation;
import com.takshak.hostel.entity.Bed;
import com.takshak.hostel.entity.User;
import com.takshak.hostel.enums.Role;
import com.takshak.hostel.exception.ApiException;
import com.takshak.hostel.repository.AllocationRepository;
import com.takshak.hostel.repository.BedRepository;
import com.takshak.hostel.security.SecurityUtils;
import java.time.Instant;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AllocationService {

    private final AllocationRepository allocationRepository;
    private final BedRepository bedRepository;
    private final UserService userService;

    public AllocationService(
            AllocationRepository allocationRepository,
            BedRepository bedRepository,
            UserService userService) {
        this.allocationRepository = allocationRepository;
        this.bedRepository = bedRepository;
        this.userService = userService;
    }

    @Transactional(readOnly = true)
    public List<AllocationDto> listAllocations() {
        return allocationRepository.findAllActiveDetailed().stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public AllocationDto myAllocation() {
        User student = SecurityUtils.currentUser();
        if (student.getRole() != Role.STUDENT) {
            throw new ApiException("Only students have allocations", 403);
        }
        return allocationRepository.findByStudentAndActiveTrue(student)
                .map(this::toDto)
                .orElse(null);
    }

    @Transactional
    public AllocationDto allocate(CreateAllocationRequest request) {
        User actor = SecurityUtils.currentUser();
        User student = userService.requireStudent(request.studentId());
        Bed bed = bedRepository.findByIdWithRoom(request.bedId())
                .orElseThrow(() -> new ApiException("Bed not found", 404));

        if (!bed.getRoom().isActive()) {
            throw new ApiException("Room is inactive", 400);
        }
        if (bed.isOccupied() || allocationRepository.findByBedIdAndActiveTrue(bed.getId()).isPresent()) {
            throw new ApiException("Bed is already occupied", 409);
        }
        if (allocationRepository.existsByStudentAndActiveTrue(student)) {
            throw new ApiException("Student already has an active allocation", 409);
        }

        Allocation allocation = new Allocation();
        allocation.setStudent(student);
        allocation.setBed(bed);
        allocation.setAllocatedAt(Instant.now());
        allocation.setActive(true);
        allocation.setAllocatedBy(actor);
        bed.setOccupied(true);
        bedRepository.save(bed);
        return toDto(allocationRepository.save(allocation));
    }

    @Transactional
    public void deallocate(Long id) {
        Allocation allocation = allocationRepository.findById(id)
                .orElseThrow(() -> new ApiException("Allocation not found", 404));
        if (!allocation.isActive()) {
            throw new ApiException("Allocation already inactive", 400);
        }
        allocation.setActive(false);
        Bed bed = allocation.getBed();
        bed.setOccupied(false);
        bedRepository.save(bed);
        allocationRepository.save(allocation);
    }

    public AllocationDto toDto(Allocation a) {
        User allocatedBy = a.getAllocatedBy();
        return new AllocationDto(
                a.getId(),
                a.getStudent().getId(),
                a.getStudent().getFullName(),
                a.getStudent().getEmail(),
                a.getStudent().getStudentId(),
                a.getBed().getId(),
                a.getBed().getRoom().getRoomNumber(),
                a.getBed().getBedLabel(),
                a.getAllocatedAt(),
                a.isActive(),
                allocatedBy != null ? allocatedBy.getId() : null,
                allocatedBy != null ? allocatedBy.getFullName() : null
        );
    }
}
