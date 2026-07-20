package com.takshak.hostel.dto;

public record NoticeCreateResponseDto(
        NoticeDto notice,
        WhatsAppSendResultDto whatsapp
) {
}
