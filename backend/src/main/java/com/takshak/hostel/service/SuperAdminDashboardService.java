package com.takshak.hostel.service;

import com.takshak.hostel.dto.BranchDashboardCardDto;
import com.takshak.hostel.dto.SuperAdminDashboardDto;
import com.takshak.hostel.entity.Branch;
import com.takshak.hostel.entity.Room;
import com.takshak.hostel.entity.StudentFee;
import com.takshak.hostel.entity.User;
import com.takshak.hostel.enums.BranchStatus;
import com.takshak.hostel.enums.Role;
import com.takshak.hostel.exception.ApiException;
import com.takshak.hostel.repository.AllocationRepository;
import com.takshak.hostel.repository.BranchRepository;
import com.takshak.hostel.repository.RoomRepository;
import com.takshak.hostel.repository.StudentFeeRepository;
import com.takshak.hostel.repository.UserRepository;
import com.takshak.hostel.security.SecurityUtils;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class SuperAdminDashboardService {

    private final BranchRepository branchRepository;
    private final UserRepository userRepository;
    private final RoomRepository roomRepository;
    private final AllocationRepository allocationRepository;
    private final StudentFeeRepository studentFeeRepository;

    public SuperAdminDashboardService(
            BranchRepository branchRepository,
            UserRepository userRepository,
            RoomRepository roomRepository,
            AllocationRepository allocationRepository,
            StudentFeeRepository studentFeeRepository) {
        this.branchRepository = branchRepository;
        this.userRepository = userRepository;
        this.roomRepository = roomRepository;
        this.allocationRepository = allocationRepository;
        this.studentFeeRepository = studentFeeRepository;
    }

    public SuperAdminDashboardDto dashboard() {
        User current = SecurityUtils.currentUser();
        if (current.getRole() != Role.SUPER_ADMIN) {
            throw new ApiException("Access denied", 403);
        }

        List<Branch> branches = branchRepository.findByStatusOrderByNameAsc(BranchStatus.ACTIVE);
        List<BranchDashboardCardDto> cards = new ArrayList<>();
        long totalStudents = 0;
        BigDecimal totalRevenue = BigDecimal.ZERO;
        long totalOccupiedRooms = 0;
        long totalAvailableRooms = 0;
        long totalBeds = 0;
        long occupiedBeds = 0;

        for (Branch branch : branches) {
            String branchId = branch.getId();
            long students = userRepository.countByRoleAndActiveTrueAndBranchId(Role.STUDENT, branchId);
            List<Room> rooms = roomRepository.findByBranchIdAndActiveTrueOrderByRoomNumberAsc(branchId);
            long roomCount = rooms.size();
            long branchTotalBeds = 0;
            long branchOccupiedBeds = 0;
            long branchOccupiedRooms = 0;
            long branchAvailableRooms = 0;

            for (Room room : rooms) {
                long roomBeds = room.getBeds().size();
                long roomOccupied = room.getBeds().stream().filter(b -> b.isOccupied()).count();
                branchTotalBeds += roomBeds;
                branchOccupiedBeds += roomOccupied;
                if (roomOccupied > 0) {
                    branchOccupiedRooms++;
                }
                if (room.getBeds().stream().anyMatch(b -> !b.isOccupied() && !b.isUnderMaintenance())) {
                    branchAvailableRooms++;
                }
            }

            BigDecimal revenue = studentFeeRepository.findByBranchId(branchId).stream()
                    .map(StudentFee::getPaidAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            double occupancyPercent = branchTotalBeds == 0
                    ? 0.0
                    : Math.round((branchOccupiedBeds * 10000.0) / branchTotalBeds) / 100.0;

            cards.add(new BranchDashboardCardDto(
                    branch.getId(),
                    branch.getName(),
                    branch.getSlug(),
                    branch.getCode(),
                    branch.getCity(),
                    students,
                    roomCount,
                    branchTotalBeds,
                    branchOccupiedBeds,
                    revenue,
                    occupancyPercent));

            totalStudents += students;
            totalRevenue = totalRevenue.add(revenue);
            totalOccupiedRooms += branchOccupiedRooms;
            totalAvailableRooms += branchAvailableRooms;
            totalBeds += branchTotalBeds;
            occupiedBeds += branchOccupiedBeds;
        }

        return new SuperAdminDashboardDto(
                branches.size(),
                totalStudents,
                totalRevenue,
                totalOccupiedRooms,
                totalAvailableRooms,
                totalBeds,
                occupiedBeds,
                cards);
    }
}
