package com.takshak.hostel.service;

import com.takshak.hostel.dto.CreateNoticeRequest;
import com.takshak.hostel.dto.NoticeDto;
import com.takshak.hostel.entity.Notice;
import com.takshak.hostel.entity.User;
import com.takshak.hostel.enums.NotificationType;
import com.takshak.hostel.enums.Role;
import com.takshak.hostel.exception.ApiException;
import com.takshak.hostel.repository.NoticeRepository;
import com.takshak.hostel.repository.UserRepository;
import com.takshak.hostel.security.SecurityUtils;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class NoticeService {

    private final NoticeRepository noticeRepository;
    private final NotificationService notificationService;
    private final UserRepository userRepository;

    public NoticeService(
            NoticeRepository noticeRepository,
            NotificationService notificationService,
            UserRepository userRepository) {
        this.noticeRepository = noticeRepository;
        this.notificationService = notificationService;
        this.userRepository = userRepository;
    }

    public List<NoticeDto> list() {
        Role role = SecurityUtils.currentUser().getRole();
        if (role == Role.ADMIN || role == Role.SUPER_ADMIN) {
            return noticeRepository.findAllByOrderByCreatedAtDesc().stream().map(this::toDto).toList();
        }
        return noticeRepository.findByActiveTrueOrderByCreatedAtDesc().stream().map(this::toDto).toList();
    }

    public NoticeDto create(CreateNoticeRequest request) {
        User actor = SecurityUtils.currentUser();
        Notice notice = new Notice();
        notice.setTitle(request.title().trim());
        notice.setBody(request.body().trim());
        notice.setCreatedById(actor.getId());
        notice.setCreatedByName(actor.getFullName());
        notice.setActive(true);
        Notice saved = noticeRepository.save(notice);
        userRepository.findByRoleIn(List.of(Role.STUDENT, Role.WARDEN, Role.ADMIN, Role.SUPER_ADMIN)).stream()
                .filter(User::isActive)
                .filter(user -> !user.getId().equals(actor.getId()))
                .forEach(user -> notificationService.notifyUser(
                        user,
                        "New notice",
                        saved.getTitle(),
                        NotificationType.NOTICE,
                        "/app/notices"));
        notificationService.notifyUser(
                actor,
                "Notice published",
                saved.getTitle() + " is now live",
                NotificationType.NOTICE,
                "/app/notices");
        return toDto(saved);
    }

    public void delete(String id) {
        Notice notice = noticeRepository.findById(id)
                .orElseThrow(() -> new ApiException("Notice not found", 404));
        notice.setActive(false);
        noticeRepository.save(notice);
    }

    private NoticeDto toDto(Notice n) {
        return new NoticeDto(
                n.getId(),
                n.getTitle(),
                n.getBody(),
                n.getCreatedById(),
                n.getCreatedByName(),
                n.getCreatedAt(),
                n.isActive()
        );
    }
}
