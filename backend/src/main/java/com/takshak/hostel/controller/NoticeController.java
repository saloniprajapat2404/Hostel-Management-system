package com.takshak.hostel.controller;

import com.takshak.hostel.dto.CreateNoticeRequest;
import com.takshak.hostel.dto.NoticeCreateResponseDto;
import com.takshak.hostel.dto.NoticeDashboardSummaryDto;
import com.takshak.hostel.dto.NoticeDto;
import com.takshak.hostel.dto.SendWhatsAppRequest;
import com.takshak.hostel.dto.UpdateNoticeRequest;
import com.takshak.hostel.dto.WhatsAppSendResultDto;
import com.takshak.hostel.enums.NoticeCategory;
import com.takshak.hostel.enums.NoticeStatus;
import com.takshak.hostel.service.NoticeService;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
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
    public List<NoticeDto> list(
            @RequestParam(required = false) NoticeCategory category,
            @RequestParam(required = false) NoticeStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return noticeService.list(category, status, from, to);
    }

    @GetMapping({ "/summary", "/dashboard-summary" })
    @PreAuthorize("isAuthenticated()")
    public NoticeDashboardSummaryDto dashboardSummary() {
        return noticeService.dashboardSummary();
    }

    @PostMapping("/send-whatsapp")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','WARDEN')")
    public WhatsAppSendResultDto sendWhatsApp(@Valid @RequestBody SendWhatsAppRequest request) {
        return noticeService.sendWhatsApp(request.noticeId());
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public NoticeDto getById(@PathVariable String id) {
        return noticeService.getById(id);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','WARDEN')")
    public NoticeCreateResponseDto create(@Valid @RequestBody CreateNoticeRequest request) {
        return noticeService.create(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','WARDEN')")
    public NoticeDto update(@PathVariable String id, @Valid @RequestBody UpdateNoticeRequest request) {
        return noticeService.update(id, request);
    }

    @PatchMapping("/{id}/expire")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','WARDEN')")
    public NoticeDto expire(@PathVariable String id) {
        return noticeService.markExpired(id);
    }

    @PatchMapping("/{id}/read")
    @PreAuthorize("isAuthenticated()")
    public NoticeDto markRead(@PathVariable String id) {
        return noticeService.markRead(id);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','WARDEN')")
    public void delete(@PathVariable String id) {
        noticeService.delete(id);
    }
}
