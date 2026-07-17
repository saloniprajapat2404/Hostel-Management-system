package com.takshak.hostel.service;

import com.takshak.hostel.dto.DashboardStatsDto;
import com.takshak.hostel.entity.User;
import com.takshak.hostel.enums.AdmissionStatus;
import com.takshak.hostel.enums.ComplaintStatus;
import com.takshak.hostel.enums.Role;
import com.takshak.hostel.repository.AdmissionRequestRepository;
import com.takshak.hostel.repository.AllocationRepository;
import com.takshak.hostel.repository.BedRepository;
import com.takshak.hostel.repository.ComplaintRepository;
import com.takshak.hostel.repository.NoticeRepository;
import com.takshak.hostel.repository.RoomRepository;
import com.takshak.hostel.repository.UserRepository;
import com.takshak.hostel.security.SecurityUtils;
import java.time.Instant;
import java.time.YearMonth;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DashboardService {

    private final UserRepository userRepository;
    private final RoomRepository roomRepository;
    private final BedRepository bedRepository;
    private final AllocationRepository allocationRepository;
    private final AdmissionRequestRepository admissionRequestRepository;
    private final ComplaintRepository complaintRepository;
    private final NoticeRepository noticeRepository;

    public DashboardService(
            UserRepository userRepository,
            RoomRepository roomRepository,
            BedRepository bedRepository,
            AllocationRepository allocationRepository,
            AdmissionRequestRepository admissionRequestRepository,
            ComplaintRepository complaintRepository,
            NoticeRepository noticeRepository) {
        this.userRepository = userRepository;
        this.roomRepository = roomRepository;
        this.bedRepository = bedRepository;
        this.allocationRepository = allocationRepository;
        this.admissionRequestRepository = admissionRequestRepository;
        this.complaintRepository = complaintRepository;
        this.noticeRepository = noticeRepository;
    }

    @Transactional(readOnly = true)
    public DashboardStatsDto stats() {
        User current = SecurityUtils.currentUser();
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("role", current.getRole().name());

        if (current.getRole() == Role.STUDENT) {
            stats.put("hasAllocation", allocationRepository.existsByStudentAndActiveTrue(current));
            allocationRepository.findByStudentAndActiveTrue(current).ifPresent(allocation -> {
                stats.put("myRoomNumber", allocation.getBed().getRoom().getRoomNumber());
                stats.put("myBedLabel", allocation.getBed().getBedLabel());
                stats.put("myFloor", allocation.getBed().getRoom().getFloor());
            });
            stats.put("activeNotices", noticeRepository.findByActiveTrueOrderByCreatedAtDesc().size());
            stats.put("myOpenComplaints",
                    complaintRepository.findByStudentOrderByCreatedAtDesc(current).stream()
                            .filter(c -> c.getStatus() != ComplaintStatus.RESOLVED)
                            .count());
            return new DashboardStatsDto(stats);
        }

        stats.put("totalRooms", roomRepository.countByActiveTrue());
        stats.put("totalBeds", bedRepository.count());
        stats.put("occupiedBeds", bedRepository.countByOccupiedTrue());
        stats.put("vacantBeds", bedRepository.countByOccupiedFalse());
        stats.put("activeAllocations", allocationRepository.countByActiveTrue());
        stats.put("activeNotices", noticeRepository.findByActiveTrueOrderByCreatedAtDesc().size());

        if (current.getRole() == Role.SUPER_ADMIN || current.getRole() == Role.ADMIN) {
            stats.put("students", userRepository.countByRoleAndActiveTrue(Role.STUDENT));
            stats.put("wardens", userRepository.countByRoleAndActiveTrue(Role.WARDEN));
            stats.put("admins", userRepository.countByRoleAndActiveTrue(Role.ADMIN));
            stats.put("pendingAdmissions", admissionRequestRepository.countByStatus(AdmissionStatus.PENDING));
            stats.put("openComplaints", complaintRepository.countByStatus(ComplaintStatus.OPEN));
            stats.put("inProgressComplaints", complaintRepository.countByStatus(ComplaintStatus.IN_PROGRESS));
            stats.put("resolvedComplaints", complaintRepository.countByStatus(ComplaintStatus.RESOLVED));
            stats.put("admissionTrend", buildAdmissionTrend());
            stats.put("floorOccupancy", buildFloorOccupancy());
        } else if (current.getRole() == Role.WARDEN) {
            stats.put("students", userRepository.countByRoleAndActiveTrue(Role.STUDENT));
            stats.put("openComplaints", complaintRepository.countByStatus(ComplaintStatus.OPEN));
            stats.put("inProgressComplaints", complaintRepository.countByStatus(ComplaintStatus.IN_PROGRESS));
            stats.put("resolvedComplaints", complaintRepository.countByStatus(ComplaintStatus.RESOLVED));
        }

        return new DashboardStatsDto(stats);
    }

    private List<Map<String, Object>> buildAdmissionTrend() {
        Instant since = Instant.now().minus(180, ChronoUnit.DAYS);
        ZoneId zone = ZoneId.systemDefault();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM yy");

        Map<YearMonth, Long> grouped = new TreeMap<>();
        YearMonth start = YearMonth.from(since.atZone(zone));
        YearMonth end = YearMonth.now(zone);
        for (YearMonth month = start; !month.isAfter(end); month = month.plusMonths(1)) {
            grouped.put(month, 0L);
        }

        admissionRequestRepository.findByCreatedAtAfterOrderByCreatedAtAsc(since).forEach(request -> {
            YearMonth month = YearMonth.from(request.getCreatedAt().atZone(zone));
            grouped.merge(month, 1L, Long::sum);
        });

        List<Map<String, Object>> trend = new ArrayList<>();
        grouped.forEach((month, count) -> {
            Map<String, Object> point = new LinkedHashMap<>();
            point.put("month", month.format(formatter));
            point.put("count", count);
            trend.add(point);
        });
        return trend;
    }

    private List<Map<String, Object>> buildFloorOccupancy() {
        List<Map<String, Object>> floors = new ArrayList<>();
        for (Object[] row : bedRepository.countOccupancyByFloor()) {
            int floor = ((Number) row[0]).intValue();
            long total = ((Number) row[1]).longValue();
            long occupied = ((Number) row[2]).longValue();
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("floor", floor);
            entry.put("total", total);
            entry.put("occupied", occupied);
            entry.put("vacant", Math.max(0, total - occupied));
            floors.add(entry);
        }
        return floors;
    }
}
