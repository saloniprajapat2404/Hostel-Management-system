package com.takshak.hostel.controller;

import com.takshak.hostel.dto.CreateNoticeRequest;
import com.takshak.hostel.dto.NoticeDto;
import com.takshak.hostel.service.NoticeService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/notices")
public class NoticeController {

    private final NoticeService noticeService;

    public NoticeController(NoticeService noticeService) {
        this.noticeService = noticeService;
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public List<NoticeDto> list() {
        return noticeService.list();
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','WARDEN')")
    public NoticeDto create(@Valid @RequestBody CreateNoticeRequest request) {
        return noticeService.create(request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public void delete(@PathVariable Long id) {
        noticeService.delete(id);
    }
}
