package com.takshak.hostel.service;

import com.takshak.hostel.dto.CreateNoticeRequest;
import com.takshak.hostel.dto.NoticeDto;
import com.takshak.hostel.entity.Notice;
import com.takshak.hostel.entity.User;
import com.takshak.hostel.exception.ApiException;
import com.takshak.hostel.repository.NoticeRepository;
import com.takshak.hostel.security.SecurityUtils;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class NoticeService {

    private final NoticeRepository noticeRepository;

    public NoticeService(NoticeRepository noticeRepository) {
        this.noticeRepository = noticeRepository;
    }

    public List<NoticeDto> list() {
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
        return toDto(noticeRepository.save(notice));
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
