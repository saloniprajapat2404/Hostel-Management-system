package com.takshak.hostel.service;

import com.takshak.hostel.dto.CreateNoticeRequest;
import com.takshak.hostel.dto.NoticeCreateResponseDto;
import com.takshak.hostel.dto.NoticeDashboardSummaryDto;
import com.takshak.hostel.dto.NoticeDto;
import com.takshak.hostel.dto.UpdateNoticeRequest;
import com.takshak.hostel.dto.WhatsAppSendResultDto;
import com.takshak.hostel.entity.Notice;
import com.takshak.hostel.entity.NoticeRead;
import com.takshak.hostel.entity.User;
import com.takshak.hostel.enums.NotificationType;
import com.takshak.hostel.enums.NoticeCategory;
import com.takshak.hostel.enums.NoticeStatus;
import com.takshak.hostel.enums.NoticeTargetAudience;
import com.takshak.hostel.enums.Role;
import com.takshak.hostel.exception.ApiException;
import com.takshak.hostel.repository.AllocationRepository;
import com.takshak.hostel.repository.NoticeReadRepository;
import com.takshak.hostel.repository.NoticeRepository;
import com.takshak.hostel.repository.UserRepository;
import com.takshak.hostel.security.BranchScope;
import com.takshak.hostel.security.SecurityUtils;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class NoticeService {

    private final NoticeRepository noticeRepository;
    private final NoticeReadRepository noticeReadRepository;
    private final NotificationService notificationService;
    private final UserRepository userRepository;
    private final AllocationRepository allocationRepository;
    private final WhatsAppService whatsAppService;
    private final BranchScope branchScope;

    public NoticeService(
            NoticeRepository noticeRepository,
            NoticeReadRepository noticeReadRepository,
            NotificationService notificationService,
            UserRepository userRepository,
            AllocationRepository allocationRepository,
            WhatsAppService whatsAppService,
            BranchScope branchScope) {
        this.noticeRepository = noticeRepository;
        this.noticeReadRepository = noticeReadRepository;
        this.notificationService = notificationService;
        this.userRepository = userRepository;
        this.allocationRepository = allocationRepository;
        this.whatsAppService = whatsAppService;
        this.branchScope = branchScope;
    }

    public List<NoticeDto> list(NoticeCategory category, NoticeStatus status, LocalDate from, LocalDate to) {
        User current = SecurityUtils.currentUser();
        List<Notice> notices = loadNoticesForRole(current);

        return notices.stream()
                .filter(notice -> category == null || notice.getCategory() == category)
                .filter(notice -> status == null || notice.getStatus() == status)
                .filter(notice -> from == null || !toInstant(notice.getCreatedAt()).isBefore(from.atStartOfDay(ZoneId.systemDefault()).toInstant()))
                .filter(notice -> to == null || !toInstant(notice.getCreatedAt()).isAfter(to.plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant()))
                .map(notice -> toDto(notice, current))
                .toList();
    }

    public NoticeDto getById(String id) {
        User current = SecurityUtils.currentUser();
        Notice notice = noticeRepository.findById(id)
                .orElseThrow(() -> new ApiException("Notice not found", 404));
        assertCanView(current, notice);
        return toDto(notice, current);
    }

    public NoticeDashboardSummaryDto dashboardSummary() {
        User current = SecurityUtils.currentUser();
        List<Notice> visible = loadNoticesForRole(current).stream()
                .filter(notice -> notice.getStatus() == NoticeStatus.ACTIVE)
                .limit(50)
                .toList();

        Set<String> readIds = readNoticeIds(current.getId());
        long unread = visible.stream().filter(n -> !readIds.contains(n.getId())).count();

        List<NoticeDto> latest = visible.stream()
                .limit(5)
                .map(notice -> toDto(notice, current))
                .toList();

        long total = isStaff(current)
                ? noticeRepository.findByBranchIdOrderByCreatedAtDesc(branchScope.requireBranchId()).size()
                : visible.size();
        long active = isStaff(current)
                ? noticeRepository.countByBranchIdAndStatus(branchScope.requireBranchId(), NoticeStatus.ACTIVE)
                : visible.size();

        return new NoticeDashboardSummaryDto(total, active, unread, latest);
    }

    public NoticeCreateResponseDto create(CreateNoticeRequest request) {
        assertCanManage();
        User actor = SecurityUtils.currentUser();
        validateTargeting(request.targetAudience(), request.roomNumber(), request.studentId());

        Notice notice = new Notice();
        applyFields(notice, request.title(), request.description(), request.category(),
                request.targetAudience(), request.roomNumber(), request.studentId());
        notice.setCreatedById(actor.getId());
        notice.setCreatedByName(actor.getFullName());
        notice.setStatus(NoticeStatus.ACTIVE);
        notice.setBranchId(branchScope.requireBranchId());
        Notice saved = noticeRepository.save(notice);

        notifyTargetedUsers(saved, actor);
        WhatsAppSendResultDto whatsappResult = null;
        boolean shouldSendWhatsApp = request.sendWhatsApp() == null || Boolean.TRUE.equals(request.sendWhatsApp());
        if (shouldSendWhatsApp) {
            whatsappResult = sendWhatsAppForNotice(saved.getId());
            saved = noticeRepository.findById(saved.getId()).orElse(saved);
        }

        return new NoticeCreateResponseDto(toDto(saved, actor), whatsappResult);
    }

    public NoticeDto update(String id, UpdateNoticeRequest request) {
        assertCanManage();
        User actor = SecurityUtils.currentUser();
        Notice notice = noticeRepository.findById(id)
                .orElseThrow(() -> new ApiException("Notice not found", 404));
        assertBranchAccess(notice);
        validateTargeting(request.targetAudience(), request.roomNumber(), request.studentId());

        applyFields(notice, request.title(), request.description(), request.category(),
                request.targetAudience(), request.roomNumber(), request.studentId());
        if (request.status() != null) {
            notice.setStatus(request.status());
        }
        return toDto(noticeRepository.save(notice), actor);
    }

    public NoticeDto markExpired(String id) {
        assertCanManage();
        User actor = SecurityUtils.currentUser();
        Notice notice = noticeRepository.findById(id)
                .orElseThrow(() -> new ApiException("Notice not found", 404));
        assertBranchAccess(notice);
        notice.setStatus(NoticeStatus.EXPIRED);
        return toDto(noticeRepository.save(notice), actor);
    }

    public void delete(String id) {
        assertCanManage();
        Notice notice = noticeRepository.findById(id)
                .orElseThrow(() -> new ApiException("Notice not found", 404));
        assertBranchAccess(notice);
        noticeRepository.delete(notice);
    }

    public NoticeDto markRead(String id) {
        User current = SecurityUtils.currentUser();
        Notice notice = noticeRepository.findById(id)
                .orElseThrow(() -> new ApiException("Notice not found", 404));
        assertCanView(current, notice);

        if (!noticeReadRepository.existsByUserIdAndNoticeId(current.getId(), id)) {
            NoticeRead read = new NoticeRead();
            read.setUserId(current.getId());
            read.setNoticeId(id);
            noticeReadRepository.save(read);
        }
        return toDto(notice, current);
    }

    public WhatsAppSendResultDto sendWhatsApp(String noticeId) {
        assertCanManage();
        return sendWhatsAppForNotice(noticeId);
    }

    private WhatsAppSendResultDto sendWhatsAppForNotice(String noticeId) {
        Notice notice = noticeRepository.findById(noticeId)
                .orElseThrow(() -> new ApiException("Notice not found", 404));
        List<User> recipients = resolveTargetStudents(notice);
        WhatsAppSendResultDto result = whatsAppService.sendNotice(notice, recipients);
        if (result.sentCount() > 0) {
            notice.setWhatsappSentAt(Instant.now());
            noticeRepository.save(notice);
        }
        return result;
    }

    private List<Notice> loadNoticesForRole(User current) {
        if (isStaff(current)) {
            return noticeRepository.findByBranchIdOrderByCreatedAtDesc(branchScope.requireBranchId());
        }
        String branchId = current.getBranchId();
        return noticeRepository.findByBranchIdAndStatusOrderByCreatedAtDesc(branchId, NoticeStatus.ACTIVE).stream()
                .filter(notice -> isNoticeVisibleToStudent(notice, current))
                .toList();
    }

    private boolean isNoticeVisibleToStudent(Notice notice, User student) {
        if (student.getRole() != Role.STUDENT) {
            return true;
        }
        return switch (notice.getTargetAudience()) {
            case ALL_STUDENTS -> true;
            case SPECIFIC_ROOM -> allocationRepository.findByStudentIdAndActiveTrue(student.getId())
                    .map(allocation -> allocation.getRoomNumber() != null
                            && notice.getRoomNumber() != null
                            && allocation.getRoomNumber().equalsIgnoreCase(notice.getRoomNumber()))
                    .orElse(false);
            case SPECIFIC_STUDENT -> matchesStudentTarget(notice, student);
        };
    }

    private boolean matchesStudentTarget(Notice notice, User student) {
        if (notice.getStudentId() == null || notice.getStudentId().isBlank()) {
            return false;
        }
        String target = notice.getStudentId().trim();
        return student.getId().equals(target)
                || (student.getStudentId() != null && student.getStudentId().equalsIgnoreCase(target));
    }

    private List<User> resolveTargetStudents(Notice notice) {
        String branchId = notice.getBranchId();
        List<User> students = userRepository.findByRoleAndBranchId(Role.STUDENT, branchId).stream()
                .filter(User::isActive)
                .toList();

        return switch (notice.getTargetAudience()) {
            case ALL_STUDENTS -> students;
            case SPECIFIC_ROOM -> students.stream()
                    .filter(student -> allocationRepository.findByStudentIdAndActiveTrue(student.getId())
                            .map(a -> a.getRoomNumber() != null
                                    && notice.getRoomNumber() != null
                                    && a.getRoomNumber().equalsIgnoreCase(notice.getRoomNumber()))
                            .orElse(false))
                    .toList();
            case SPECIFIC_STUDENT -> students.stream()
                    .filter(student -> matchesStudentTarget(notice, student))
                    .toList();
        };
    }

    private void notifyTargetedUsers(Notice notice, User actor) {
        List<User> targets = resolveTargetStudents(notice);
        Set<String> notified = new HashSet<>();
        for (User user : targets) {
            if (user.getId().equals(actor.getId()) || !notified.add(user.getId())) {
                continue;
            }
            notificationService.notifyUser(
                    user,
                    "New notice",
                    notice.getTitle(),
                    NotificationType.NOTICE,
                    "/app/notices");
        }
        notificationService.notifyUser(
                actor,
                "Notice published",
                notice.getTitle() + " is now live",
                NotificationType.NOTICE,
                "/app/notices");
    }

    private void validateTargeting(NoticeTargetAudience audience, String roomNumber, String studentId) {
        if (audience == NoticeTargetAudience.SPECIFIC_ROOM
                && (roomNumber == null || roomNumber.isBlank())) {
            throw new ApiException("Room number is required for room-specific notices", 400);
        }
        if (audience == NoticeTargetAudience.SPECIFIC_STUDENT
                && (studentId == null || studentId.isBlank())) {
            throw new ApiException("Student ID is required for student-specific notices", 400);
        }
    }

    private void applyFields(
            Notice notice,
            String title,
            String description,
            NoticeCategory category,
            NoticeTargetAudience targetAudience,
            String roomNumber,
            String studentId) {
        notice.setTitle(title.trim());
        notice.setDescription(description.trim());
        notice.setCategory(category);
        notice.setTargetAudience(targetAudience);
        notice.setRoomNumber(blankToNull(roomNumber));
        notice.setStudentId(blankToNull(studentId));
    }

    private NoticeDto toDto(Notice notice, User viewer) {
        Set<String> readIds = readNoticeIds(viewer.getId());
        return new NoticeDto(
                notice.getId(),
                notice.getTitle(),
                notice.getDescription(),
                notice.getCategory() != null ? notice.getCategory() : NoticeCategory.GENERAL,
                notice.getTargetAudience() != null ? notice.getTargetAudience() : NoticeTargetAudience.ALL_STUDENTS,
                notice.getRoomNumber(),
                notice.getStudentId(),
                notice.getCreatedById(),
                notice.getCreatedByName(),
                notice.getCreatedAt(),
                notice.getStatus(),
                notice.getWhatsappSentAt(),
                readIds.contains(notice.getId()));
    }

    private Set<String> readNoticeIds(String userId) {
        return noticeReadRepository.findByUserId(userId).stream()
                .map(NoticeRead::getNoticeId)
                .collect(Collectors.toSet());
    }

    private void assertCanManage() {
        Role role = SecurityUtils.currentUser().getRole();
        if (role != Role.ADMIN && role != Role.SUPER_ADMIN && role != Role.WARDEN) {
            throw new ApiException("Access denied", 403);
        }
    }

    private void assertCanView(User viewer, Notice notice) {
        if (isStaff(viewer)) {
            assertBranchAccess(notice);
            return;
        }
        if (viewer.getRole() == Role.STUDENT && notice.getStatus() == NoticeStatus.ACTIVE
                && isNoticeVisibleToStudent(notice, viewer)) {
            return;
        }
        throw new ApiException("Access denied", 403);
    }

    private boolean isStaff(User user) {
        Role role = user.getRole();
        return role == Role.ADMIN || role == Role.SUPER_ADMIN || role == Role.WARDEN;
    }

    private Instant toInstant(Instant value) {
        return Objects.requireNonNullElse(value, Instant.EPOCH);
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private void assertBranchAccess(Notice notice) {
        String branchId = branchScope.requireBranchId();
        if (notice.getBranchId() == null || !notice.getBranchId().equals(branchId)) {
            throw new ApiException("Notice not found", 404);
        }
    }
}
