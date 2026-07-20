package com.takshak.hostel.service;

import com.takshak.hostel.config.TwilioProperties;
import com.takshak.hostel.dto.WhatsAppSendResultDto;
import com.takshak.hostel.entity.Notice;
import com.takshak.hostel.entity.User;
import com.takshak.hostel.enums.NoticeCategory;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

/**
 * Sends hostel notices via the Twilio WhatsApp API.
 * When Twilio is disabled, messages are logged for local development.
 */
@Service
public class WhatsAppService {

    private static final Logger log = LoggerFactory.getLogger(WhatsAppService.class);
    private static final DateTimeFormatter DATE_FMT =
            DateTimeFormatter.ofPattern("dd MMM yyyy, HH:mm").withZone(ZoneId.of("Asia/Kolkata"));

    private final TwilioProperties twilioProperties;
    private final RestClient restClient;

    public WhatsAppService(TwilioProperties twilioProperties) {
        this.twilioProperties = twilioProperties;
        this.restClient = RestClient.create();
    }

    public WhatsAppSendResultDto sendNotice(Notice notice, List<User> recipients) {
        if (recipients == null || recipients.isEmpty()) {
            return WhatsAppSendResultDto.skipped("No recipients with WhatsApp numbers");
        }

        String messageBody = formatNoticeMessage(notice);
        if (!twilioProperties.isConfigured()) {
            log.info(
                    "Twilio WhatsApp disabled. Notice '{}' would be sent to {} recipient(s):\n{}",
                    notice.getTitle(),
                    recipients.size(),
                    messageBody);
            return WhatsAppSendResultDto.skipped(
                    "Twilio WhatsApp is disabled — configure twilio.enabled=true and credentials");
        }

        int sent = 0;
        int failed = 0;
        List<String> failures = new ArrayList<>();

        for (User student : recipients) {
            String to = resolveWhatsAppNumber(student);
            if (to == null) {
                failed++;
                failures.add(student.getFullName() + ": no WhatsApp number");
                continue;
            }
            try {
                sendSingle(to, messageBody);
                sent++;
            } catch (Exception ex) {
                failed++;
                failures.add(student.getFullName() + ": " + ex.getMessage());
                log.warn("WhatsApp send failed for {}: {}", student.getFullName(), ex.getMessage());
            }
        }

        return WhatsAppSendResultDto.ok(sent, failed, failures);
    }

    /** Builds the standard hostel notice WhatsApp message body. */
    public String formatNoticeMessage(Notice notice) {
        String categoryLabel = formatCategory(notice.getCategory());
        String dateLabel = notice.getCreatedAt() != null
                ? DATE_FMT.format(notice.getCreatedAt())
                : DATE_FMT.format(Instant.now());

        return """
                --------------------------------
                Hostel Notice
                Title: %s
                Category: %s
                Description: %s
                Date: %s
                --------------------------------
                """.formatted(
                        notice.getTitle(),
                        categoryLabel,
                        notice.getDescription(),
                        dateLabel).trim();
    }

    private void sendSingle(String toWhatsApp, String body) {
        String from = normalizeWhatsAppAddress(twilioProperties.getWhatsappFrom());
        String to = normalizeWhatsAppAddress(toWhatsApp);

        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("From", from);
        form.add("To", to);
        form.add("Body", body);

        String url = "https://api.twilio.com/2010-04-01/Accounts/"
                + twilioProperties.getAccountSid()
                + "/Messages.json";

        String credentials = twilioProperties.getAccountSid() + ":" + twilioProperties.getAuthToken();
        String basicAuth = Base64.getEncoder().encodeToString(credentials.getBytes());

        try {
            restClient.post()
                    .uri(url)
                    .header("Authorization", "Basic " + basicAuth)
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(form)
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientResponseException ex) {
            throw new IllegalStateException("Twilio error " + ex.getStatusCode().value() + ": " + ex.getResponseBodyAsString());
        }
    }

    /**
     * Prefer dedicated WhatsApp number, then phone, then parent contact.
     */
    public String resolveWhatsAppNumber(User user) {
        String raw = firstNonBlank(user.getWhatsappNumber(), user.getPhone(), user.getParentPhone());
        if (raw == null) {
            return null;
        }
        return normalizeWhatsAppAddress(raw);
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value.trim();
            }
        }
        return null;
    }

    /** Ensures numbers are Twilio WhatsApp addresses (whatsapp:+E164). */
    public String normalizeWhatsAppAddress(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String value = raw.trim();
        if (value.startsWith("whatsapp:")) {
            return value;
        }
        String digits = value.replaceAll("[^\\d+]", "");
        if (digits.startsWith("+")) {
            return "whatsapp:" + digits;
        }
        if (digits.length() == 10) {
            return "whatsapp:+91" + digits;
        }
        if (digits.length() == 12 && digits.startsWith("91")) {
            return "whatsapp:+" + digits;
        }
        return "whatsapp:+" + digits;
    }

    private String formatCategory(NoticeCategory category) {
        if (category == null) {
            return "General";
        }
        return switch (category) {
            case GENERAL -> "General";
            case FEE -> "Fee";
            case MAINTENANCE -> "Maintenance";
            case EMERGENCY -> "Emergency";
            case EVENT -> "Event";
        };
    }
}
