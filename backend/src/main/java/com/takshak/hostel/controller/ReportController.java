package com.takshak.hostel.controller;

import com.takshak.hostel.dto.OccupancyReportDto;
import com.takshak.hostel.service.ReportService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/occupancy")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','WARDEN')")
    public OccupancyReportDto occupancy() {
        return reportService.occupancy();
    }
}
