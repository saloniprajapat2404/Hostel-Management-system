package com.takshak.hostel.controller;

import com.takshak.hostel.dto.AttendanceDto;
import com.takshak.hostel.dto.CreateAttendanceRequest;
import com.takshak.hostel.service.AttendanceService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {

    private final AttendanceService attendanceService;

    public AttendanceController(AttendanceService attendanceService) {
        this.attendanceService = attendanceService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','WARDEN')")
    public List<AttendanceDto> list() {
        return attendanceService.list();
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','WARDEN')")
    public AttendanceDto record(@Valid @RequestBody CreateAttendanceRequest request) {
        return attendanceService.record(request);
    }
}
