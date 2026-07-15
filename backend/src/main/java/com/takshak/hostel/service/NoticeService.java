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
import org.springframework.transaction.annotation.Transactional;

@Service
public class NoticeService {

    private final NoticeRepository noticeRepository;

    public NoticeService(NoticeRepository noticeRepository) {
        this.noticeRepository = noticeRepository;
    }

    @Transactional(readOnly = true)
    public List<NoticeDto> list() {
        return noticeRepository.findActiveDetailed().stream().map(this::toDto).toList();
    }

    @Transactional
    public NoticeDto create(CreateNoticeRequest request) {
        Notice notice = new Notice();
        notice.setTitle(request.title().trim());
        notice.setBody(request.body().trim());
        notice.setCreatedBy(SecurityUtils.currentUser());
        notice.setActive(true);
        return toDto(noticeRepository.save(notice));
    }

    @Transactional
    public void delete(Long id) {
        Notice notice = noticeRepository.findById(id)
                .orElseThrow(() -> new ApiException("Notice not found", 404));
        notice.setActive(false);
        noticeRepository.save(notice);
    }

    private NoticeDto toDto(Notice n) {
        User createdBy = n.getCreatedBy();
        return new NoticeDto(
                n.getId(),
                n.getTitle(),
                n.getBody(),
                createdBy != null ? createdBy.getId() : null,
                createdBy != null ? createdBy.getFullName() : null,
                n.getCreatedAt(),
                n.isActive()
        );
    }
}
