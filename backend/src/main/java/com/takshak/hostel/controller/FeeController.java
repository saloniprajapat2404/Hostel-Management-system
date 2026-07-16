package com.takshak.hostel.controller;

import com.takshak.hostel.dto.CreateStudentFeeRequest;
import com.takshak.hostel.dto.FeeOverviewDto;
import com.takshak.hostel.dto.RecordPaymentRequest;
import com.takshak.hostel.dto.StudentFeeDetailDto;
import com.takshak.hostel.dto.StudentFeeSummaryDto;
import com.takshak.hostel.service.StudentFeeService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/fees")
public class FeeController {

    private final StudentFeeService studentFeeService;

    public FeeController(StudentFeeService studentFeeService) {
        this.studentFeeService = studentFeeService;
    }

    @GetMapping("/overview")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public FeeOverviewDto overview() {
        return studentFeeService.overview();
    }

    @GetMapping("/students")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public List<StudentFeeSummaryDto> studentSummaries() {
        return studentFeeService.studentSummaries();
    }

    @GetMapping("/students/{studentId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public List<StudentFeeDetailDto> studentFees(@PathVariable Long studentId) {
        return studentFeeService.studentFees(studentId);
    }

    @PostMapping("/students/{studentId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public StudentFeeDetailDto createFee(
            @PathVariable Long studentId,
            @Valid @RequestBody CreateStudentFeeRequest request) {
        return studentFeeService.createFee(studentId, request);
    }

    @PostMapping("/{feeId}/payments")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public StudentFeeDetailDto recordPayment(
            @PathVariable Long feeId,
            @Valid @RequestBody RecordPaymentRequest request) {
        return studentFeeService.recordPayment(feeId, request);
    }
}
