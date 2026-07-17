package com.takshak.hostel.service;

import com.takshak.hostel.dto.OccupancyReportDto;
import com.takshak.hostel.dto.RoomDto;
import com.takshak.hostel.repository.BedRepository;
import com.takshak.hostel.repository.RoomRepository;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class ReportService {

    private final RoomRepository roomRepository;
    private final BedRepository bedRepository;
    private final RoomService roomService;

    public ReportService(RoomRepository roomRepository, BedRepository bedRepository, RoomService roomService) {
        this.roomRepository = roomRepository;
        this.bedRepository = bedRepository;
        this.roomService = roomService;
    }

    public OccupancyReportDto occupancy() {
        List<RoomDto> rooms = roomService.listRooms();
        long totalRooms = roomRepository.countByActiveTrue();
        long totalBeds = bedRepository.count();
        long occupiedBeds = bedRepository.countByOccupiedTrue();
        long vacantBeds = bedRepository.countByOccupiedFalse();
        double percent = totalBeds == 0 ? 0.0 : Math.round((occupiedBeds * 10000.0) / totalBeds) / 100.0;
        return new OccupancyReportDto(totalRooms, totalBeds, occupiedBeds, vacantBeds, percent, rooms);
    }
}
