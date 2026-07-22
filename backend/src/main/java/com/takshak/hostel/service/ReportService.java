package com.takshak.hostel.service;

import com.takshak.hostel.dto.OccupancyReportDto;
import com.takshak.hostel.dto.RoomDto;
import com.takshak.hostel.repository.BedRepository;
import com.takshak.hostel.repository.RoomRepository;
import com.takshak.hostel.security.BranchScope;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class ReportService {

    private final RoomRepository roomRepository;
    private final BedRepository bedRepository;
    private final RoomService roomService;
    private final BranchScope branchScope;

    public ReportService(
            RoomRepository roomRepository,
            BedRepository bedRepository,
            RoomService roomService,
            BranchScope branchScope) {
        this.roomRepository = roomRepository;
        this.bedRepository = bedRepository;
        this.roomService = roomService;
        this.branchScope = branchScope;
    }

    public OccupancyReportDto occupancy() {
        String branchId = branchScope.requireBranchId();
        List<RoomDto> rooms = roomService.listRooms();
        long totalRooms = roomRepository.countByBranchIdAndActiveTrue(branchId);
        long totalBeds = bedRepository.count(branchId);
        long occupiedBeds = bedRepository.countByOccupiedTrue(branchId);
        long vacantBeds = bedRepository.countByOccupiedFalse(branchId);
        double percent = totalBeds == 0 ? 0.0 : Math.round((occupiedBeds * 10000.0) / totalBeds) / 100.0;
        return new OccupancyReportDto(totalRooms, totalBeds, occupiedBeds, vacantBeds, percent, rooms);
    }
}
