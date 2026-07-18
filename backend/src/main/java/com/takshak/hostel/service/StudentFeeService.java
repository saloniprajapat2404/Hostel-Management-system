package com.takshak.hostel.service;

import com.takshak.hostel.dto.CreateStudentFeeRequest;
import com.takshak.hostel.dto.FeeOverviewDto;
import com.takshak.hostel.dto.RecordPaymentRequest;
import com.takshak.hostel.dto.StudentFeeDetailDto;
import com.takshak.hostel.dto.StudentFeeSummaryDto;
import com.takshak.hostel.entity.FeePayment;
import com.takshak.hostel.entity.StudentFee;
import com.takshak.hostel.entity.User;
import com.takshak.hostel.enums.FeeStatus;
import com.takshak.hostel.enums.NotificationType;
import com.takshak.hostel.enums.PaymentMethod;
import com.takshak.hostel.enums.Role;
import com.takshak.hostel.exception.ApiException;
import com.takshak.hostel.repository.StudentFeeRepository;
import com.takshak.hostel.repository.UserRepository;
import com.takshak.hostel.security.SecurityUtils;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class StudentFeeService {

    private final StudentFeeRepository studentFeeRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public StudentFeeService(
            StudentFeeRepository studentFeeRepository,
            UserRepository userRepository,
            NotificationService notificationService) {
        this.studentFeeRepository = studentFeeRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    public List<StudentFeeDetailDto> myFees() {
        User current = SecurityUtils.currentUser();
        if (current.getRole() != Role.STUDENT) {
            throw new ApiException("Only students have fee records", 403);
        }
        return studentFeeRepository.findByStudentIdOrderByDueDateDesc(current.getId()).stream()
                .map(StudentFeeDetailDto::from)
                .toList();
    }

    public FeeOverviewDto overview() {
        assertAdminAccess();
        List<User> students = userRepository.findByRole(Role.STUDENT).stream()
                .filter(User::isActive)
                .toList();

        int fullyPaid = 0;
        int partial = 0;
        int pending = 0;
        BigDecimal totalExpected = BigDecimal.ZERO;
        BigDecimal totalCollected = BigDecimal.ZERO;

        for (User student : students) {
            StudentFeeSummaryDto summary = buildSummary(student);
            totalExpected = totalExpected.add(summary.totalFees());
            totalCollected = totalCollected.add(summary.totalPaid());
            switch (summary.overallStatus()) {
                case PAID -> fullyPaid++;
                case PARTIAL -> partial++;
                default -> pending++;
            }
        }

        return new FeeOverviewDto(
                students.size(),
                fullyPaid,
                partial,
                pending,
                totalExpected,
                totalCollected,
                totalExpected.subtract(totalCollected).max(BigDecimal.ZERO)
        );
    }

    public List<StudentFeeSummaryDto> studentSummaries() {
        assertAdminAccess();
        return userRepository.findByRole(Role.STUDENT).stream()
                .filter(User::isActive)
                .sorted(Comparator.comparing(User::getFullName))
                .map(this::buildSummary)
                .toList();
    }

    public List<StudentFeeDetailDto> studentFees(String studentId) {
        assertAdminAccess();
        User student = requireStudent(studentId);
        return studentFeeRepository.findByStudentIdOrderByDueDateDesc(student.getId()).stream()
                .map(StudentFeeDetailDto::from)
                .toList();
    }

    public StudentFeeDetailDto createFee(String studentId, CreateStudentFeeRequest request) {
        assertAdminAccess();
        User student = requireStudent(studentId);

        StudentFee fee = new StudentFee();
        fee.setStudentId(student.getId());
        fee.setFeeType(request.feeType().trim());
        fee.setAcademicYear(request.academicYear().trim());
        fee.setTotalAmount(request.totalAmount());
        fee.setPaidAmount(BigDecimal.ZERO);
        fee.setDueDate(request.dueDate());
        fee.setStatus(FeeStatus.PENDING);
        return StudentFeeDetailDto.from(studentFeeRepository.save(fee));
    }

    public StudentFeeDetailDto recordPayment(String feeId, RecordPaymentRequest request) {
        assertAdminAccess();
        User actor = SecurityUtils.currentUser();
        StudentFee fee = studentFeeRepository.findById(feeId)
                .orElseThrow(() -> new ApiException("Fee record not found", 404));

        BigDecimal balance = fee.getTotalAmount().subtract(fee.getPaidAmount());
        if (request.amount().compareTo(balance) > 0) {
            throw new ApiException("Payment exceeds remaining balance of " + balance, 400);
        }

        FeePayment payment = new FeePayment();
        payment.setAmount(request.amount());
        payment.setMethod(request.method());
        payment.setReferenceNote(trimToNull(request.referenceNote()));
        payment.setRecordedById(actor.getId());
        payment.setRecordedByName(actor.getFullName());
        payment.setPaidAt(Instant.now());
        fee.getPayments().add(payment);

        recalculateFee(fee);
        StudentFee saved = studentFeeRepository.save(fee);
        userRepository.findById(saved.getStudentId()).ifPresent(student ->
                notificationService.notifyUser(
                        student,
                        "Fee payment received",
                        "₹" + request.amount() + " recorded for " + saved.getFeeType(),
                        NotificationType.FEE,
                        "/app/my-fees"));
        return StudentFeeDetailDto.from(saved);
    }

    private StudentFeeSummaryDto buildSummary(User student) {
        List<StudentFee> fees = studentFeeRepository.findByStudentIdOrderByDueDateDesc(student.getId());
        BigDecimal totalFees = BigDecimal.ZERO;
        BigDecimal totalPaid = BigDecimal.ZERO;
        PaymentMethod lastMethod = null;
        Instant lastPaidAt = null;

        for (StudentFee fee : fees) {
            totalFees = totalFees.add(fee.getTotalAmount());
            totalPaid = totalPaid.add(fee.getPaidAmount());
            for (FeePayment payment : fee.getPayments()) {
                if (lastPaidAt == null || payment.getPaidAt().isAfter(lastPaidAt)) {
                    lastPaidAt = payment.getPaidAt();
                    lastMethod = payment.getMethod();
                }
            }
        }

        BigDecimal balance = totalFees.subtract(totalPaid).max(BigDecimal.ZERO);
        FeeStatus overall = resolveStatus(totalFees, totalPaid);

        return new StudentFeeSummaryDto(
                student.getId(),
                student.getFullName(),
                student.getEmail(),
                student.getStudentId(),
                totalFees,
                totalPaid,
                balance,
                overall,
                fees.size(),
                lastMethod
        );
    }

    private void recalculateFee(StudentFee fee) {
        BigDecimal paid = fee.getPayments().stream()
                .map(FeePayment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        fee.setPaidAmount(paid);
        fee.setStatus(resolveStatus(fee.getTotalAmount(), paid));
    }

    private FeeStatus resolveStatus(BigDecimal total, BigDecimal paid) {
        if (paid.compareTo(BigDecimal.ZERO) <= 0) {
            return FeeStatus.PENDING;
        }
        if (paid.compareTo(total) >= 0) {
            return FeeStatus.PAID;
        }
        return FeeStatus.PARTIAL;
    }

    private User requireStudent(String studentId) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ApiException("Student not found", 404));
        if (student.getRole() != Role.STUDENT) {
            throw new ApiException("User is not a student", 400);
        }
        return student;
    }

    private void assertAdminAccess() {
        Role role = SecurityUtils.currentUser().getRole();
        if (role != Role.ADMIN && role != Role.SUPER_ADMIN) {
            throw new ApiException("Access denied", 403);
        }
    }

    private String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    public void seedPayment(StudentFee fee, BigDecimal amount, PaymentMethod method, String note, User recordedBy) {
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            return;
        }
        FeePayment payment = new FeePayment();
        payment.setAmount(amount);
        payment.setMethod(method);
        payment.setReferenceNote(note);
        payment.setRecordedById(recordedBy.getId());
        payment.setRecordedByName(recordedBy.getFullName());
        payment.setPaidAt(Instant.now());
        fee.getPayments().add(payment);
        recalculateFee(fee);
        studentFeeRepository.save(fee);
    }
}
