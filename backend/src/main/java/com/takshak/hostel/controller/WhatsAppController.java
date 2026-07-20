package com.takshak.hostel.controller;

import com.takshak.hostel.config.TwilioProperties;
import com.takshak.hostel.dto.WhatsAppStatusDto;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/whatsapp")
public class WhatsAppController {

    private final TwilioProperties twilioProperties;

    public WhatsAppController(TwilioProperties twilioProperties) {
        this.twilioProperties = twilioProperties;
    }

    @GetMapping("/status")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','WARDEN')")
    public WhatsAppStatusDto status() {
        if (twilioProperties.isConfigured()) {
            return new WhatsAppStatusDto(
                    true,
                    true,
                    "Twilio WhatsApp is active — notices can be delivered to student numbers.");
        }
        if (twilioProperties.isEnabled()) {
            return new WhatsAppStatusDto(
                    true,
                    false,
                    "Twilio is enabled but credentials are incomplete. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_WHATSAPP_FROM.");
        }
        return new WhatsAppStatusDto(
                false,
                false,
                "Twilio WhatsApp is disabled — messages are logged only. Set TWILIO_ENABLED=true to send live messages.");
    }
}
