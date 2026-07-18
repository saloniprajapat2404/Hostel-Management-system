package com.takshak.hostel.service;

import com.takshak.hostel.dto.AllocationDto;
import com.takshak.hostel.dto.CreateAllocationRequest;
import com.takshak.hostel.entity.Allocation;
import com.takshak.hostel.entity.User;
import com.takshak.hostel.enums.NotificationType;
import com.takshak.hostel.enums.Role;
import com.takshak.hostel.exception.ApiException;
import com.takshak.hostel.repository.AllocationRepository;
import com.takshak.hostel.repository.BedRepository;
import com.takshak.hostel.security.SecurityUtils;
import com.takshak.hostel.service.NotificationService;
import java.time.Instant;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class AllocationService {

    private final AllocationRepository allocationRepository;
    private final BedRepository bedRepository;
    private final UserService userService;
    private final NotificationService notificationService;

    public AllocationService(
            AllocationRepository allocationRepository,
            BedRepository bedRepository,
            UserService userService,
            NotificationService notificationService) {
        this.allocationRepository = allocationRepository;
        this.bedRepository = bedRepository;
        this.userService = userService;
        this.notificationService = notificationService;
    }

    public List<AllocationDto> listAllocations() {
        return allocationRepository.findByActiveTrueOrderByAllocatedAtDesc().stream()
                .map(this::toDto)
                .toList();
    }

    public AllocationDto myAllocation() {
        User student = SecurityUtils.currentUser();
        if (student.getRole() != Role.STUDENT) {
            throw new ApiException("Only students have allocations", 403);
        }
        return allocationRepository.findByStudentIdAndActiveTrue(student.getId())
                .map(this::toDto)
                .orElse(null);
    }

    public AllocationDto allocate(CreateAllocationRequest request) {
        User actor = SecurityUtils.currentUser();
        User student = userService.requireStudent(request.studentId());
        BedRepository.BedWithRoom bedWithRoom = bedRepository.findByIdWithRoom(request.bedId())
                .orElseThrow(() -> new ApiException("Bed not found", 404));

        if (!bedWithRoom.room().isActive()) {
            throw new ApiException("Room is inactive", 400);
        }
        if (bedWithRoom.bed().isOccupied()
                || allocationRepository.findByBedIdAndActiveTrue(bedWithRoom.bed().getId()).isPresent()) {
            throw new ApiException("Bed is already occupied", 409);
        }
        if (allocationRepository.existsByStudentIdAndActiveTrue(student.getId())) {
            throw new ApiException("Student already has an active allocation", 409);
        }

        bedRepository.saveOccupied(bedWithRoom, true);

        Allocation allocation = new Allocation();
        allocation.setStudentId(student.getId());
        allocation.setStudentName(student.getFullName());
        allocation.setStudentEmail(student.getEmail());
        allocation.setStudentCode(student.getStudentId());
        allocation.setBedId(bedWithRoom.bed().getId());
        allocation.setRoomId(bedWithRoom.room().getId());
        allocation.setRoomNumber(bedWithRoom.room().getRoomNumber());
        allocation.setBedLabel(bedWithRoom.bed().getBedLabel());
        allocation.setFloor(bedWithRoom.room().getFloor());
        allocation.setAllocatedAt(Instant.now());
        allocation.setActive(true);
        allocation.setAllocatedById(actor.getId());
        allocation.setAllocatedByName(actor.getFullName());
        Allocation saved = allocationRepository.save(allocation);
        notificationService.notifyUser(
                student,
                "Room allocated",
                saved.getRoomNumber() + " · bed " + saved.getBedLabel(),
                NotificationType.ALLOCATION,
                "/app/my-room");
        return toDto(saved);
    }

    public void deallocate(String id) {
        Allocation allocation = allocationRepository.findById(id)
                .orElseThrow(() -> new ApiException("Allocation not found", 404));
        if (!allocation.isActive()) {
            throw new ApiException("Allocation already inactive", 400);
        }
        allocation.setActive(false);
        bedRepository.setOccupied(allocation.getBedId(), false);
        allocationRepository.save(allocation);
    }

    public AllocationDto toDto(Allocation a) {
        return new AllocationDto(
                a.getId(),
                a.getStudentId(),
                a.getStudentName(),
                a.getStudentEmail(),
                a.getStudentCode(),
                a.getBedId(),
                a.getRoomNumber(),
                a.getBedLabel(),
                a.getAllocatedAt(),
                a.isActive(),
                a.getAllocatedById(),
                a.getAllocatedByName()
        );
    }
}
