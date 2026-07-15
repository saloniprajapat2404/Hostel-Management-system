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
import java.util.LinkedHashMap;
import java.util.Map;
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
        } else if (current.getRole() == Role.WARDEN) {
            stats.put("students", userRepository.countByRoleAndActiveTrue(Role.STUDENT));
            stats.put("openComplaints", complaintRepository.countByStatus(ComplaintStatus.OPEN));
            stats.put("inProgressComplaints", complaintRepository.countByStatus(ComplaintStatus.IN_PROGRESS));
        } else {
            stats.put("myOpenComplaints",
                    complaintRepository.findByStudentOrderByCreatedAtDesc(current).stream()
                            .filter(c -> c.getStatus() != ComplaintStatus.RESOLVED)
                            .count());
            stats.put("hasAllocation", allocationRepository.existsByStudentAndActiveTrue(current));
        }

        return new DashboardStatsDto(stats);
    }
}
