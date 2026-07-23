package com.takshak.hostel.config;

import com.takshak.hostel.entity.AdmissionRequest;
import com.takshak.hostel.entity.Allocation;
import com.takshak.hostel.entity.Bed;
import com.takshak.hostel.entity.Branch;
import com.takshak.hostel.entity.Complaint;
import com.takshak.hostel.entity.Expense;
import com.takshak.hostel.entity.Notice;
import com.takshak.hostel.entity.Room;
import com.takshak.hostel.entity.StudentFee;
import com.takshak.hostel.entity.SystemSetting;
import com.takshak.hostel.entity.User;
import com.takshak.hostel.enums.AdmissionStatus;
import com.takshak.hostel.enums.BranchStatus;
import com.takshak.hostel.enums.ComplaintStatus;
import com.takshak.hostel.enums.FeeStatus;
import com.takshak.hostel.enums.NoticeCategory;
import com.takshak.hostel.enums.NoticeStatus;
import com.takshak.hostel.enums.NoticeTargetAudience;
import com.takshak.hostel.enums.NotificationType;
import com.takshak.hostel.enums.PaymentMethod;
import com.takshak.hostel.enums.Role;
import com.takshak.hostel.repository.AdmissionRequestRepository;
import com.takshak.hostel.repository.AllocationRepository;
import com.takshak.hostel.repository.BranchRepository;
import com.takshak.hostel.repository.ComplaintRepository;
import com.takshak.hostel.repository.ExpenseRepository;
import com.takshak.hostel.repository.NoticeRepository;
import com.takshak.hostel.repository.CheckInOutRepository;
import com.takshak.hostel.repository.RoomRepository;
import com.takshak.hostel.repository.StudentFeeRepository;
import com.takshak.hostel.repository.SystemSettingRepository;
import com.takshak.hostel.repository.UserRepository;
import com.takshak.hostel.repository.NotificationRepository;
import com.takshak.hostel.service.NotificationService;
import com.takshak.hostel.service.StudentFeeService;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import org.bson.types.ObjectId;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);
    private static final String DEMO_PASSWORD = "demo123";

    private final UserRepository userRepository;
    private final BranchRepository branchRepository;
    private final RoomRepository roomRepository;
    private final AllocationRepository allocationRepository;
    private final AdmissionRequestRepository admissionRequestRepository;
    private final ComplaintRepository complaintRepository;
    private final NoticeRepository noticeRepository;
    private final SystemSettingRepository systemSettingRepository;
    private final StudentFeeRepository studentFeeRepository;
    private final StudentFeeService studentFeeService;
    private final NotificationRepository notificationRepository;
    private final NotificationService notificationService;
    private final ExpenseRepository expenseRepository;
    private final CheckInOutRepository checkInOutRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(
            UserRepository userRepository,
            BranchRepository branchRepository,
            RoomRepository roomRepository,
            AllocationRepository allocationRepository,
            AdmissionRequestRepository admissionRequestRepository,
            ComplaintRepository complaintRepository,
            NoticeRepository noticeRepository,
            SystemSettingRepository systemSettingRepository,
            StudentFeeRepository studentFeeRepository,
            StudentFeeService studentFeeService,
            NotificationRepository notificationRepository,
            NotificationService notificationService,
            ExpenseRepository expenseRepository,
            CheckInOutRepository checkInOutRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.branchRepository = branchRepository;
        this.roomRepository = roomRepository;
        this.allocationRepository = allocationRepository;
        this.admissionRequestRepository = admissionRequestRepository;
        this.complaintRepository = complaintRepository;
        this.noticeRepository = noticeRepository;
        this.systemSettingRepository = systemSettingRepository;
        this.studentFeeRepository = studentFeeRepository;
        this.studentFeeService = studentFeeService;
        this.notificationRepository = notificationRepository;
        this.notificationService = notificationService;
        this.expenseRepository = expenseRepository;
        this.checkInOutRepository = checkInOutRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        ensureBranches();

        if (userRepository.count() > 0) {
            log.info("Database already seeded — running branch/fee/profile backfill");
            ensureBranches();
            backfillBranchIds();
            seedBranchAdmins(passwordEncoder.encode(DEMO_PASSWORD));
            ensureDefaultSettings();
            ensureNotifications();
            ensureStudentProfilesAndFees();
            return;
        }

        log.info("Seeding Takshak Hostel demo data...");
        String encoded = passwordEncoder.encode(DEMO_PASSWORD);
        String vijayNagarId = branchRepository.findBySlug("vijay-nagar")
                .orElseThrow()
                .getId();

        User superAdmin = saveUser("superadmin@takshak.edu", encoded, "Super Admin", Role.SUPER_ADMIN, null, "9000000001", null);
        User admin = saveUser("admin@takshak.edu", encoded, "Hostel Admin", Role.ADMIN, null, "9000000002", vijayNagarId);
        User warden = saveUser("warden@takshak.edu", encoded, "Hostel Warden", Role.WARDEN, null, "9000000003", vijayNagarId);

        seedBranchAdmins(encoded);

        List<User> students = new ArrayList<>();
        for (int i = 1; i <= 20; i++) {
            String num = String.format("%02d", i);
            String studentId = String.format("STU2024%03d", i);
            User student = saveUser(
                    "student" + num + "@takshak.edu",
                    encoded,
                    "Student " + num,
                    Role.STUDENT,
                    studentId,
                    "98" + String.format("%08d", 10000000 + i),
                    vijayNagarId
            );
            student.setWhatsappNumber("+9198" + String.format("%08d", 10000000 + i));
            student = userRepository.save(student);
            if (i == 1) {
                student.setAadharNumber("234567890123");
                student.setAddressLine("Hostel Block A, Room R01");
                student.setCity("Pune");
                student.setState("Maharashtra");
                student.setPincode("411001");
                student.setParentPhone("9876543210");
                student = userRepository.save(student);
            }
            students.add(student);
        }

        List<Bed> allBeds = new ArrayList<>();
        List<Room> rooms = new ArrayList<>();
        for (int i = 1; i <= 30; i++) {
            Room room = new Room();
            room.setRoomNumber(String.format("R%02d", i));
            room.setFloor(((i - 1) % 5) + 1);
            room.setCapacity(2);
            room.setActive(true);
            room.setBranchId(vijayNagarId);

            Bed bedA = newBed("A");
            Bed bedB = newBed("B");
            room.getBeds().add(bedA);
            room.getBeds().add(bedB);
            room = roomRepository.save(room);
            rooms.add(room);
            allBeds.add(room.getBeds().get(0));
            allBeds.add(room.getBeds().get(1));
        }

        // Allocate first 15 students to first 15 beds
        for (int i = 0; i < 15; i++) {
            Room room = rooms.get(i / 2);
            Bed bed = allBeds.get(i);
            bed.setOccupied(true);
            roomRepository.save(room);

            Allocation allocation = new Allocation();
            allocation.setStudentId(students.get(i).getId());
            allocation.setStudentName(students.get(i).getFullName());
            allocation.setStudentEmail(students.get(i).getEmail());
            allocation.setStudentCode(students.get(i).getStudentId());
            allocation.setBedId(bed.getId());
            allocation.setRoomId(room.getId());
            allocation.setRoomNumber(room.getRoomNumber());
            allocation.setBedLabel(bed.getBedLabel());
            allocation.setFloor(room.getFloor());
            allocation.setAllocatedAt(Instant.now());
            allocation.setActive(true);
            allocation.setAllocatedById(admin.getId());
            allocation.setAllocatedByName(admin.getFullName());
            allocation.setBranchId(vijayNagarId);
            allocationRepository.save(allocation);
        }

        AdmissionRequest a1 = new AdmissionRequest();
        a1.setStudentName("Rahul Sharma");
        a1.setEmail("rahul.sharma@applicant.edu");
        a1.setPhone("9876500001");
        a1.setStudentId("STU2024101");
        a1.setStatus(AdmissionStatus.PENDING);
        a1.setNotes("First year CSE applicant");
        a1.setBranchId(vijayNagarId);
        admissionRequestRepository.save(a1);

        AdmissionRequest a2 = new AdmissionRequest();
        a2.setStudentName("Priya Patel");
        a2.setEmail("priya.patel@applicant.edu");
        a2.setPhone("9876500002");
        a2.setStudentId("STU2024102");
        a2.setStatus(AdmissionStatus.PENDING);
        a2.setNotes("Prefers ground floor if possible");
        a2.setBranchId(vijayNagarId);
        admissionRequestRepository.save(a2);

        Complaint c1 = new Complaint();
        c1.setStudentId(students.get(0).getId());
        c1.setStudentName(students.get(0).getFullName());
        c1.setTitle("Broken fan in room");
        c1.setDescription("Ceiling fan in R01 bed A is making noise and not spinning properly.");
        c1.setStatus(ComplaintStatus.OPEN);
        c1.setBranchId(vijayNagarId);
        complaintRepository.save(c1);

        Complaint c2 = new Complaint();
        c2.setStudentId(students.get(1).getId());
        c2.setStudentName(students.get(1).getFullName());
        c2.setTitle("Wi-Fi connectivity issue");
        c2.setDescription("Hostel Wi-Fi drops frequently in the evening on floor 1.");
        c2.setStatus(ComplaintStatus.OPEN);
        c2.setBranchId(vijayNagarId);
        complaintRepository.save(c2);

        systemSettingRepository.save(new SystemSetting("hostelName", "Takshak Hostel"));
        systemSettingRepository.save(new SystemSetting("systemName", "Hostel Management System"));
        systemSettingRepository.save(new SystemSetting("totalRooms", "30"));
        systemSettingRepository.save(new SystemSetting("bedsPerRoom", "2"));

        seedFeesForStudents(students, vijayNagarId);
        ensureNotifications();
        seedSampleRoomsForOtherBranches();

        log.info("Seed complete: users={}, rooms=30, allocations=15 (admin={}, superAdmin={})",
                userRepository.count(), admin.getEmail(), superAdmin.getEmail());
    }

    private void ensureBranches() {
        // City = Indore / Bhopal; name = locality campus
        seedBranchIfMissing("Vijay Nagar", "VJN", "vijay-nagar", "Indore",
                "12, Scheme 78, Vijay Nagar, Indore", "9001110001", "vijaynagar@takshak.edu");
        seedBranchIfMissing("MP Nagar", "MPN", "mp-nagar", "Indore",
                "45, Zone II, MP Nagar, Indore", "9001110002", "mpnagar@takshak.edu");
        seedBranchIfMissing("AB Road", "ABR", "ab-road", "Indore",
                "88, AB Road, Indore", "9001110003", "abroad@takshak.edu");
        seedBranchIfMissing("Rajwada", "RJW", "rajwada", "Indore",
                "Near Rajwada Palace, Indore", "9001110005", "rajwada@takshak.edu");
        seedBranchIfMissing("Palasia", "PLS", "palasia", "Indore",
                "14, Palasia Square, Indore", "9001110006", "palasia@takshak.edu");
        seedBranchIfMissing("Rajendra Nagar", "RJN", "rajendra-nagar", "Indore",
                "7, Rajendra Nagar, Indore", "9001110007", "rajendranagar@takshak.edu");
        seedBranchIfMissing("Arera Colony", "ARC", "arera-colony", "Bhopal",
                "22, Arera Colony, Bhopal", "9001110004", "arera@takshak.edu");
        migrateBranchCityLocality();
    }

    /**
     * Normalize legacy flat branches into City → Locality (name = locality, city = main city).
     * Keeps existing branch IDs / slugs where possible so operational data stays linked.
     */
    private void migrateBranchCityLocality() {
        migrateBranchSlug("vijay-nagar", "Vijay Nagar", "Indore",
                "12, Scheme 78, Vijay Nagar, Indore");
        migrateBranchSlug("mp-nagar", "MP Nagar", "Indore",
                "45, Zone II, MP Nagar, Indore");
        // Legacy "indore" slug → AB Road locality under Indore city
        migrateBranchSlug("indore", "AB Road", "Indore", "88, AB Road, Indore");
        // Legacy "bhopal" slug → Arera Colony under Bhopal city
        migrateBranchSlug("bhopal", "Arera Colony", "Bhopal", "22, Arera Colony, Bhopal");
    }

    private void migrateBranchSlug(String slug, String locality, String city, String address) {
        branchRepository.findBySlug(slug).ifPresent(branch -> {
            boolean changed = false;
            if (!locality.equals(branch.getName())) {
                branch.setName(locality);
                changed = true;
            }
            if (branch.getCity() == null || !city.equalsIgnoreCase(branch.getCity().trim())) {
                branch.setCity(city);
                changed = true;
            }
            if (branch.getAddress() == null || branch.getAddress().isBlank()) {
                branch.setAddress(address);
                changed = true;
            }
            if (changed) {
                branch.setUpdatedAt(Instant.now());
                branchRepository.save(branch);
                log.info("Migrated branch {} → city={}, locality={}", slug, city, locality);
            }
        });
    }

    private void seedBranchIfMissing(
            String name, String code, String slug, String city,
            String address, String phone, String email) {
        if (branchRepository.findBySlug(slug).isPresent()) {
            return;
        }
        // Avoid creating a second AB Road / Arera if legacy slug still exists under old code
        if ("ab-road".equals(slug) && branchRepository.findBySlug("indore").isPresent()) {
            return;
        }
        if ("arera-colony".equals(slug) && branchRepository.findBySlug("bhopal").isPresent()) {
            return;
        }
        Branch branch = new Branch();
        branch.setName(name);
        branch.setCode(code);
        branch.setSlug(slug);
        branch.setCity(city);
        branch.setAddress(address);
        branch.setPhone(phone);
        branch.setEmail(email);
        branch.setStatus(BranchStatus.ACTIVE);
        branchRepository.save(branch);
        log.info("Seeded locality branch: {} / {}", city, name);
    }

    private void seedBranchAdmins(String encoded) {
        seedBranchAdminIfMissing("mp-nagar", "admin.mp@takshak.edu", "MP Nagar Admin", "9000000010", encoded);
        seedBranchAdminIfMissing("indore", "admin.indore@takshak.edu", "Indore Admin", "9000000011", encoded);
        seedBranchAdminIfMissing("bhopal", "admin.bhopal@takshak.edu", "Bhopal Admin", "9000000012", encoded);
    }

    private void seedBranchAdminIfMissing(String slug, String email, String name, String phone, String encoded) {
        if (userRepository.findByEmailIgnoreCase(email).isPresent()) {
            return;
        }
        branchRepository.findBySlug(slug).ifPresent(branch ->
                saveUser(email, encoded, name, Role.ADMIN, null, phone, branch.getId()));
    }

    private void seedSampleRoomsForOtherBranches() {
        branchRepository.findBySlug("mp-nagar").ifPresent(branch -> {
            if (roomRepository.findByBranchIdOrderByRoomNumberAsc(branch.getId()).isEmpty()) {
                for (int i = 1; i <= 5; i++) {
                    Room room = new Room();
                    room.setRoomNumber(String.format("MP%02d", i));
                    room.setFloor(1);
                    room.setCapacity(2);
                    room.setActive(true);
                    room.setBranchId(branch.getId());
                    Bed bedA = newBed("A");
                    Bed bedB = newBed("B");
                    room.getBeds().add(bedA);
                    room.getBeds().add(bedB);
                    roomRepository.save(room);
                }
            }
        });
    }

    private void backfillBranchIds() {
        String defaultBranchId = branchRepository.findBySlug("vijay-nagar")
                .map(Branch::getId)
                .orElseGet(() -> branchRepository.findAllByOrderByNameAsc().stream()
                        .findFirst()
                        .map(Branch::getId)
                        .orElse(null));
        if (defaultBranchId == null) {
            return;
        }

        userRepository.findAll().forEach(user -> {
            if (user.getRole() != Role.SUPER_ADMIN && user.getBranchId() == null) {
                user.setBranchId(defaultBranchId);
                userRepository.save(user);
            }
        });

        roomRepository.findAll().forEach(room -> {
            if (room.getBranchId() == null) {
                room.setBranchId(defaultBranchId);
                roomRepository.save(room);
            }
        });

        allocationRepository.findAll().forEach(item -> {
            if (item.getBranchId() == null) {
                item.setBranchId(defaultBranchId);
                allocationRepository.save(item);
            }
        });

        admissionRequestRepository.findAll().forEach(item -> {
            if (item.getBranchId() == null) {
                item.setBranchId(defaultBranchId);
                admissionRequestRepository.save(item);
            }
        });

        complaintRepository.findAll().forEach(item -> {
            if (item.getBranchId() == null) {
                item.setBranchId(defaultBranchId);
                complaintRepository.save(item);
            }
        });

        noticeRepository.findAll().forEach(item -> {
            if (item.getBranchId() == null) {
                item.setBranchId(defaultBranchId);
                noticeRepository.save(item);
            }
        });

        studentFeeRepository.findAll().forEach(item -> {
            if (item.getBranchId() == null) {
                item.setBranchId(defaultBranchId);
                studentFeeRepository.save(item);
            }
        });

        expenseRepository.findAll().forEach(item -> {
            if (item.getBranchId() == null) {
                item.setBranchId(defaultBranchId);
                expenseRepository.save(item);
            }
        });

        checkInOutRepository.findAll().forEach(item -> {
            if (item.getBranchId() == null) {
                item.setBranchId(defaultBranchId);
                checkInOutRepository.save(item);
            }
        });
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
        ensureExpenses();
        seedDummyNotices();
    }

    private void seedDummyNotices() {
        User creator = userRepository.findByEmailIgnoreCase("admin@takshak.edu")
                .or(() -> userRepository.findByEmailIgnoreCase("superadmin@takshak.edu"))
                .orElse(null);
        if (creator == null) {
            return;
        }

        seedNoticeIfMissing(
                creator,
                "Welcome to Takshak Hostel",
                "Please read hostel timings, visitor rules, and mess schedule on the notice board.",
                NoticeCategory.GENERAL);
        seedNoticeIfMissing(
                creator,
                "Mess Menu Update",
                "Updated mess menu for this week is available. Lunch timing remains 12:30 PM to 2:00 PM.",
                NoticeCategory.EVENT);
    }

    private void seedNoticeIfMissing(User creator, String title, String description, NoticeCategory category) {
        boolean exists = noticeRepository.findAll().stream()
                .anyMatch(notice -> title.equals(notice.getTitle()));
        if (exists) {
            return;
        }

        Notice notice = new Notice();
        notice.setTitle(title);
        notice.setDescription(description);
        notice.setCategory(category);
        notice.setTargetAudience(NoticeTargetAudience.ALL_STUDENTS);
        notice.setCreatedById(creator.getId());
        notice.setCreatedByName(creator.getFullName());
        notice.setStatus(NoticeStatus.ACTIVE);
        notice.setCreatedAt(Instant.now());
        notice.setBranchId(creator.getBranchId());
        noticeRepository.save(notice);

        String message = title + " is now live";
        userRepository.findAll().stream()
                .filter(User::isActive)
                .forEach(user -> {
                    boolean alreadyNotified = notificationRepository.findAll().stream()
                            .anyMatch(notification ->
                                    user.getId().equals(notification.getUserId())
                                            && message.equals(notification.getMessage())
                                            && notification.getType() == NotificationType.NOTICE);
                    if (!alreadyNotified) {
                        notificationService.notifyUser(
                                user,
                                "New notice",
                                message,
                                NotificationType.NOTICE,
                                "/app/notices");
                    }
                });

        log.info("Seeded demo notice: {}", title);
    }

    private void ensureExpenses() {
        if (expenseRepository.count() > 0) {
            return;
        }
        userRepository.findByEmailIgnoreCase("superadmin@takshak.edu").ifPresent(superAdmin -> {
            Expense maintenance = new Expense();
            maintenance.setCategory("Maintenance");
            maintenance.setDescription("Generator fuel and common-area repairs");
            maintenance.setAmount(new BigDecimal("12500"));
            maintenance.setExpenseDate(LocalDate.now().minusDays(12));
            maintenance.setRecordedById(superAdmin.getId());
            maintenance.setRecordedByName(superAdmin.getFullName());
            maintenance.setBranchId(superAdmin.getBranchId() != null
                    ? superAdmin.getBranchId()
                    : branchRepository.findBySlug("vijay-nagar").map(Branch::getId).orElse(null));
            expenseRepository.save(maintenance);

            Expense utilities = new Expense();
            utilities.setCategory("Utilities");
            utilities.setDescription("Electricity bill — hostel block A");
            utilities.setAmount(new BigDecimal("28750"));
            utilities.setExpenseDate(LocalDate.now().minusDays(5));
            utilities.setRecordedById(superAdmin.getId());
            utilities.setRecordedByName(superAdmin.getFullName());
            utilities.setBranchId(maintenance.getBranchId());
            expenseRepository.save(utilities);
        });
    }

    private void ensureStudentProfilesAndFees() {
        userRepository.findByEmailIgnoreCase("student01@takshak.edu").ifPresent(student -> {
            if (student.getAadharNumber() == null) {
                student.setAadharNumber("234567890123");
                student.setAddressLine("Hostel Block A, Room R01");
                student.setCity("Pune");
                student.setState("Maharashtra");
                student.setPincode("411001");
            }
            if (student.getParentPhone() == null) {
                student.setParentPhone("9876543210");
            }
            if (student.getWhatsappNumber() == null) {
                student.setWhatsappNumber("+919876543210");
            }
            userRepository.save(student);
        });

        userRepository.findByRole(Role.STUDENT).forEach(student -> {
            if (student.getWhatsappNumber() == null && student.getPhone() != null && !student.getPhone().isBlank()) {
                String digits = student.getPhone().replaceAll("\\D", "");
                if (digits.length() >= 10) {
                    student.setWhatsappNumber("+91" + digits.substring(digits.length() - 10));
                    userRepository.save(student);
                }
            }
            if (studentFeeRepository.findByStudentIdOrderByDueDateDesc(student.getId()).isEmpty()) {
                seedFeesForStudent(student);
            } else {
                ensurePaymentsForStudent(student);
            }
        });
    }

    private void ensurePaymentsForStudent(User student) {
        User admin = userRepository.findByEmailIgnoreCase("admin@takshak.edu").orElse(student);
        studentFeeRepository.findByStudentIdOrderByDueDateDesc(student.getId()).forEach(fee -> {
            if (fee.getPayments().isEmpty() && fee.getPaidAmount().compareTo(BigDecimal.ZERO) > 0) {
                PaymentMethod method = switch (fee.getFeeType()) {
                    case "Hostel Fee" -> PaymentMethod.ONLINE;
                    case "Mess Fee" -> PaymentMethod.CASH;
                    default -> PaymentMethod.ONLINE;
                };
                studentFeeService.seedPayment(fee, fee.getPaidAmount(), method, "Migrated demo payment", admin);
            }
        });
    }

    private void seedFeesForStudents(List<User> students, String branchId) {
        students.forEach(student -> seedFeesForStudent(student, branchId));
    }

    private void seedFeesForStudent(User student) {
        seedFeesForStudent(student, student.getBranchId());
    }

    private void seedFeesForStudent(User student, String branchId) {
        User admin = userRepository.findByEmailIgnoreCase("admin@takshak.edu").orElse(student);

        StudentFee hostel = saveFeeRecord(student, "Hostel Fee", "2025-26", new BigDecimal("45000"),
                LocalDate.of(2026, 7, 31), branchId);
        studentFeeService.seedPayment(hostel, new BigDecimal("20000"), PaymentMethod.ONLINE,
                "Online ref TXN-HOSTEL-001", admin);
        studentFeeService.seedPayment(hostel, new BigDecimal("10000"), PaymentMethod.ONLINE,
                "Online gateway ORD-9920", admin);

        StudentFee mess = saveFeeRecord(student, "Mess Fee", "2025-26", new BigDecimal("18000"),
                LocalDate.of(2026, 6, 30), branchId);
        studentFeeService.seedPayment(mess, new BigDecimal("18000"), PaymentMethod.CASH,
                "Paid at accounts office", admin);

        StudentFee deposit = saveFeeRecord(student, "Security Deposit", "2025-26", new BigDecimal("5000"),
                LocalDate.of(2025, 8, 15), branchId);
        studentFeeService.seedPayment(deposit, new BigDecimal("5000"), PaymentMethod.ONLINE,
                "Online gateway ORD-9921", admin);
    }

    private StudentFee saveFeeRecord(
            User student,
            String feeType,
            String academicYear,
            BigDecimal total,
            LocalDate dueDate,
            String branchId) {
        StudentFee fee = new StudentFee();
        fee.setStudentId(student.getId());
        fee.setFeeType(feeType);
        fee.setAcademicYear(academicYear);
        fee.setTotalAmount(total);
        fee.setPaidAmount(BigDecimal.ZERO);
        fee.setDueDate(dueDate);
        fee.setStatus(FeeStatus.PENDING);
        fee.setBranchId(branchId);
        return studentFeeRepository.save(fee);
    }

    private Bed newBed(String label) {
        Bed bed = new Bed();
        bed.setId(new ObjectId().toHexString());
        bed.setBedLabel(label);
        bed.setOccupied(false);
        return bed;
    }

    private User saveUser(
            String email,
            String encodedPassword,
            String fullName,
            Role role,
            String studentId,
            String phone,
            String branchId) {
        User user = new User();
        user.setEmail(email);
        user.setPassword(encodedPassword);
        user.setFullName(fullName);
        user.setRole(role);
        user.setStudentId(studentId);
        user.setPhone(phone);
        user.setBranchId(branchId);
        user.setActive(true);
        return userRepository.save(user);
    }
}
