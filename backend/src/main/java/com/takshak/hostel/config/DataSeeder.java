package com.takshak.hostel.config;

import com.takshak.hostel.entity.AdmissionRequest;
import com.takshak.hostel.entity.Allocation;
import com.takshak.hostel.entity.Bed;
import com.takshak.hostel.entity.Complaint;
import com.takshak.hostel.entity.Notice;
import com.takshak.hostel.entity.Room;
import com.takshak.hostel.entity.StudentFee;
import com.takshak.hostel.entity.SystemSetting;
import com.takshak.hostel.entity.User;
import com.takshak.hostel.enums.AdmissionStatus;
import com.takshak.hostel.enums.ComplaintStatus;
import com.takshak.hostel.enums.FeeStatus;
import com.takshak.hostel.enums.PaymentMethod;
import com.takshak.hostel.enums.Role;
import com.takshak.hostel.repository.AdmissionRequestRepository;
import com.takshak.hostel.repository.AllocationRepository;
import com.takshak.hostel.repository.BedRepository;
import com.takshak.hostel.repository.ComplaintRepository;
import com.takshak.hostel.repository.NoticeRepository;
import com.takshak.hostel.repository.RoomRepository;
import com.takshak.hostel.repository.StudentFeeRepository;
import com.takshak.hostel.repository.SystemSettingRepository;
import com.takshak.hostel.repository.UserRepository;
import com.takshak.hostel.enums.NotificationType;
import com.takshak.hostel.repository.NotificationRepository;
import com.takshak.hostel.service.NotificationService;
import com.takshak.hostel.service.StudentFeeService;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);
    private static final String DEMO_PASSWORD = "demo123";

    private final UserRepository userRepository;
    private final RoomRepository roomRepository;
    private final BedRepository bedRepository;
    private final AllocationRepository allocationRepository;
    private final AdmissionRequestRepository admissionRequestRepository;
    private final ComplaintRepository complaintRepository;
    private final NoticeRepository noticeRepository;
    private final SystemSettingRepository systemSettingRepository;
    private final StudentFeeRepository studentFeeRepository;
    private final StudentFeeService studentFeeService;
    private final NotificationService notificationService;
    private final NotificationRepository notificationRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(
            UserRepository userRepository,
            RoomRepository roomRepository,
            BedRepository bedRepository,
            AllocationRepository allocationRepository,
            AdmissionRequestRepository admissionRequestRepository,
            ComplaintRepository complaintRepository,
            NoticeRepository noticeRepository,
            SystemSettingRepository systemSettingRepository,
            StudentFeeRepository studentFeeRepository,
            StudentFeeService studentFeeService,
            NotificationService notificationService,
            NotificationRepository notificationRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roomRepository = roomRepository;
        this.bedRepository = bedRepository;
        this.allocationRepository = allocationRepository;
        this.admissionRequestRepository = admissionRequestRepository;
        this.complaintRepository = complaintRepository;
        this.noticeRepository = noticeRepository;
        this.systemSettingRepository = systemSettingRepository;
        this.studentFeeRepository = studentFeeRepository;
        this.studentFeeService = studentFeeService;
        this.notificationService = notificationService;
        this.notificationRepository = notificationRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (userRepository.count() > 0) {
            log.info("Database already seeded — running fee/profile backfill");
            ensureDefaultSettings();
            ensureNotifications();
            ensureStudentProfilesAndFees();
            return;
        }

        log.info("Seeding Takshak Hostel demo data...");
        String encoded = passwordEncoder.encode(DEMO_PASSWORD);

        User superAdmin = saveUser("superadmin@takshak.edu", encoded, "Super Admin", Role.SUPER_ADMIN, null, "9000000001");
        User admin = saveUser("admin@takshak.edu", encoded, "Hostel Admin", Role.ADMIN, null, "9000000002");
        User warden = saveUser("warden@takshak.edu", encoded, "Hostel Warden", Role.WARDEN, null, "9000000003");

        List<User> students = new ArrayList<>();
        for (int i = 1; i <= 20; i++) {
            String num = String.format("%02d", i);
            String studentId = String.format("STU2024%03d", i);
            students.add(saveUser(
                    "student" + num + "@takshak.edu",
                    encoded,
                    "Student " + num,
                    Role.STUDENT,
                    studentId,
                    "98" + String.format("%08d", 10000000 + i)
            ));
        }

        List<Bed> allBeds = new ArrayList<>();
        for (int i = 1; i <= 30; i++) {
            Room room = new Room();
            room.setRoomNumber(String.format("R%02d", i));
            room.setFloor(((i - 1) % 5) + 1);
            room.setCapacity(2);
            room.setActive(true);

            Bed bedA = new Bed();
            bedA.setRoom(room);
            bedA.setBedLabel("A");
            bedA.setOccupied(false);

            Bed bedB = new Bed();
            bedB.setRoom(room);
            bedB.setBedLabel("B");
            bedB.setOccupied(false);

            room.getBeds().add(bedA);
            room.getBeds().add(bedB);
            roomRepository.save(room);
            allBeds.add(bedA);
            allBeds.add(bedB);
        }

        // Allocate first 15 students to first 15 beds (R01-A .. R08-A)
        for (int i = 0; i < 15; i++) {
            Bed bed = allBeds.get(i);
            bed.setOccupied(true);
            bedRepository.save(bed);

            Allocation allocation = new Allocation();
            allocation.setStudent(students.get(i));
            allocation.setBed(bed);
            allocation.setAllocatedAt(Instant.now());
            allocation.setActive(true);
            allocation.setAllocatedBy(admin);
            allocationRepository.save(allocation);
        }

        Notice n1 = new Notice();
        n1.setTitle("Welcome to Takshak Hostel");
        n1.setBody("Welcome students! Please follow hostel timings and keep rooms clean.");
        n1.setCreatedBy(admin);
        n1.setActive(true);
        noticeRepository.save(n1);

        Notice n2 = new Notice();
        n2.setTitle("Mess Menu Update");
        n2.setBody("New weekly mess menu is available at the notice board and mess counter.");
        n2.setCreatedBy(warden);
        n2.setActive(true);
        noticeRepository.save(n2);

        Notice n3 = new Notice();
        n3.setTitle("Maintenance Window");
        n3.setBody("Water supply maintenance on Sunday 10 AM – 1 PM. Kindly store water in advance.");
        n3.setCreatedBy(admin);
        n3.setActive(true);
        noticeRepository.save(n3);

        AdmissionRequest a1 = new AdmissionRequest();
        a1.setStudentName("Rahul Sharma");
        a1.setEmail("rahul.sharma@applicant.edu");
        a1.setPhone("9876500001");
        a1.setStudentId("STU2024101");
        a1.setStatus(AdmissionStatus.PENDING);
        a1.setNotes("First year CSE applicant");
        admissionRequestRepository.save(a1);

        AdmissionRequest a2 = new AdmissionRequest();
        a2.setStudentName("Priya Patel");
        a2.setEmail("priya.patel@applicant.edu");
        a2.setPhone("9876500002");
        a2.setStudentId("STU2024102");
        a2.setStatus(AdmissionStatus.PENDING);
        a2.setNotes("Prefers ground floor if possible");
        admissionRequestRepository.save(a2);

        Complaint c1 = new Complaint();
        c1.setStudent(students.get(0));
        c1.setTitle("Broken fan in room");
        c1.setDescription("Ceiling fan in R01 bed A is making noise and not spinning properly.");
        c1.setStatus(ComplaintStatus.OPEN);
        complaintRepository.save(c1);

        Complaint c2 = new Complaint();
        c2.setStudent(students.get(1));
        c2.setTitle("Wi-Fi connectivity issue");
        c2.setDescription("Hostel Wi-Fi drops frequently in the evening on floor 1.");
        c2.setStatus(ComplaintStatus.OPEN);
        complaintRepository.save(c2);

        systemSettingRepository.save(new SystemSetting("hostelName", "Takshak Hostel"));
        systemSettingRepository.save(new SystemSetting("systemName", "Hostel Management System"));
        systemSettingRepository.save(new SystemSetting("totalRooms", "30"));
        systemSettingRepository.save(new SystemSetting("bedsPerRoom", "2"));

        seedFeesForStudents(students);
        seedDemoNotifications(admin, warden, students.get(0));

        log.info("Seed complete: users={}, rooms=30, allocations=15 (admin={}, superAdmin={})",
                userRepository.count(), admin.getEmail(), superAdmin.getEmail());
    }

    private void ensureDefaultSettings() {
        ensureSetting("hostelName", "Takshak Hostel");
        ensureSetting("systemName", "Hostel Management System");
    }

    private void ensureSetting(String key, String defaultValue) {
        if (systemSettingRepository.findBySettingKey(key).isEmpty()) {
            systemSettingRepository.save(new SystemSetting(key, defaultValue));
        }
    }

    private void ensureNotifications() {
        if (notificationRepository.count() > 0) {
            return;
        }
        userRepository.findByEmailIgnoreCase("admin@takshak.edu").ifPresent(admin ->
                userRepository.findByEmailIgnoreCase("warden@takshak.edu").ifPresent(warden ->
                        userRepository.findByEmailIgnoreCase("student01@takshak.edu").ifPresent(student ->
                                seedDemoNotifications(admin, warden, student))));
    }

    private void seedDemoNotifications(User admin, User warden, User student) {
        Instant now = Instant.now();

        notificationService.create(
                admin,
                "New admission request",
                "Rahul Sharma submitted an admission request",
                NotificationType.ADMISSION,
                "/app/admissions",
                now.minusSeconds(3600));
        notificationService.create(
                admin,
                "Open complaint",
                "Broken fan in room — needs attention",
                NotificationType.COMPLAINT,
                "/app/complaints",
                now.minusSeconds(7200));
        notificationService.create(
                admin,
                "Notice published",
                "Mess Menu Update is now live",
                NotificationType.NOTICE,
                "/app/notices",
                now.minusSeconds(86400));

        notificationService.create(
                warden,
                "Complaint assigned",
                "Wi-Fi connectivity issue reported on floor 1",
                NotificationType.COMPLAINT,
                "/app/complaints",
                now.minusSeconds(5400));
        notificationService.create(
                warden,
                "New notice",
                "Maintenance Window scheduled for Sunday",
                NotificationType.NOTICE,
                "/app/notices",
                now.minusSeconds(43200));

        notificationService.create(
                student,
                "Fee payment received",
                "₹10,000 hostel fee payment recorded",
                NotificationType.FEE,
                "/app/my-fees",
                now.minusSeconds(10800));
        notificationService.create(
                student,
                "New notice",
                "Welcome notice — read hostel timings",
                NotificationType.NOTICE,
                "/app/notices",
                now.minusSeconds(172800));
    }

    private void ensureStudentProfilesAndFees() {
        userRepository.findByEmailIgnoreCase("student01@takshak.edu").ifPresent(student -> {
            if (student.getAadharNumber() == null) {
                student.setAadharNumber("2345 6789 0123");
                student.setAddressLine("Hostel Block A, Room R01");
                student.setCity("Pune");
                student.setState("Maharashtra");
                student.setPincode("411001");
                userRepository.save(student);
            }
        });

        userRepository.findByRole(Role.STUDENT).forEach(student -> {
            if (studentFeeRepository.findByStudentOrderByDueDateDesc(student).isEmpty()) {
                seedFeesForStudent(student);
            } else {
                ensurePaymentsForStudent(student);
            }
        });
    }

    private void ensurePaymentsForStudent(User student) {
        User admin = userRepository.findByEmailIgnoreCase("admin@takshak.edu").orElse(student);
        studentFeeRepository.findByStudentWithPayments(student).forEach(fee -> {
            if (fee.getPayments().isEmpty() && fee.getPaidAmount().compareTo(BigDecimal.ZERO) > 0) {
                PaymentMethod method = switch (fee.getFeeType()) {
                    case "Hostel Fee" -> PaymentMethod.UPI;
                    case "Mess Fee" -> PaymentMethod.CASH;
                    default -> PaymentMethod.BANK_TRANSFER;
                };
                studentFeeService.seedPayment(fee, fee.getPaidAmount(), method, "Migrated demo payment", admin);
            }
        });
    }

    private void seedFeesForStudents(List<User> students) {
        students.forEach(this::seedFeesForStudent);
    }

    private void seedFeesForStudent(User student) {
        User admin = userRepository.findByEmailIgnoreCase("admin@takshak.edu").orElse(student);

        StudentFee hostel = saveFeeRecord(student, "Hostel Fee", "2025-26", new BigDecimal("45000"),
                LocalDate.of(2026, 7, 31));
        studentFeeService.seedPayment(hostel, new BigDecimal("20000"), PaymentMethod.UPI,
                "UPI ref TXN-HOSTEL-001", admin);
        studentFeeService.seedPayment(hostel, new BigDecimal("10000"), PaymentMethod.BANK_TRANSFER,
                "NEFT ref NEFT8821", admin);

        StudentFee mess = saveFeeRecord(student, "Mess Fee", "2025-26", new BigDecimal("18000"),
                LocalDate.of(2026, 6, 30));
        studentFeeService.seedPayment(mess, new BigDecimal("18000"), PaymentMethod.CASH,
                "Paid at accounts office", admin);

        StudentFee deposit = saveFeeRecord(student, "Security Deposit", "2025-26", new BigDecimal("5000"),
                LocalDate.of(2025, 8, 15));
        studentFeeService.seedPayment(deposit, new BigDecimal("5000"), PaymentMethod.ONLINE,
                "Online gateway ORD-9921", admin);
    }

    private StudentFee saveFeeRecord(
            User student,
            String feeType,
            String academicYear,
            BigDecimal total,
            LocalDate dueDate) {
        StudentFee fee = new StudentFee();
        fee.setStudent(student);
        fee.setFeeType(feeType);
        fee.setAcademicYear(academicYear);
        fee.setTotalAmount(total);
        fee.setPaidAmount(BigDecimal.ZERO);
        fee.setDueDate(dueDate);
        fee.setStatus(FeeStatus.PENDING);
        return studentFeeRepository.save(fee);
    }

    private User saveUser(
            String email,
            String encodedPassword,
            String fullName,
            Role role,
            String studentId,
            String phone) {
        User user = new User();
        user.setEmail(email);
        user.setPassword(encodedPassword);
        user.setFullName(fullName);
        user.setRole(role);
        user.setStudentId(studentId);
        user.setPhone(phone);
        user.setActive(true);
        return userRepository.save(user);
    }
}
