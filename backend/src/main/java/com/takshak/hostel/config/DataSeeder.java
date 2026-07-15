package com.takshak.hostel.config;

import com.takshak.hostel.entity.AdmissionRequest;
import com.takshak.hostel.entity.Allocation;
import com.takshak.hostel.entity.Bed;
import com.takshak.hostel.entity.Complaint;
import com.takshak.hostel.entity.Notice;
import com.takshak.hostel.entity.Room;
import com.takshak.hostel.entity.SystemSetting;
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
import com.takshak.hostel.repository.SystemSettingRepository;
import com.takshak.hostel.repository.UserRepository;
import java.time.Instant;
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
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roomRepository = roomRepository;
        this.bedRepository = bedRepository;
        this.allocationRepository = allocationRepository;
        this.admissionRequestRepository = admissionRequestRepository;
        this.complaintRepository = complaintRepository;
        this.noticeRepository = noticeRepository;
        this.systemSettingRepository = systemSettingRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (userRepository.count() > 0) {
            log.info("Database already seeded — skipping DataSeeder");
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
        systemSettingRepository.save(new SystemSetting("totalRooms", "30"));
        systemSettingRepository.save(new SystemSetting("bedsPerRoom", "2"));

        log.info("Seed complete: users={}, rooms=30, allocations=15 (admin={}, superAdmin={})",
                userRepository.count(), admin.getEmail(), superAdmin.getEmail());
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
