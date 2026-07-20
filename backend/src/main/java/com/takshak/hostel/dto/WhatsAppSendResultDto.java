package com.takshak.hostel.dto;

import java.util.List;

/**
 * Result of a bulk WhatsApp send operation.
 */
public record WhatsAppSendResultDto(
        boolean success,
        int sentCount,
        int failedCount,
        String message,
        List<String> failures
) {
    public static WhatsAppSendResultDto ok(int sent, int failed, List<String> failures) {
        return new WhatsAppSendResultDto(
                failed == 0,
                sent,
                failed,
                failed == 0 ? "WhatsApp messages sent successfully" : "Some messages failed to send",
                failures == null ? List.of() : failures);
    }

    public static WhatsAppSendResultDto skipped(String reason) {
        return new WhatsAppSendResultDto(true, 0, 0, reason, List.of());
    }
}
