package com.takshak.hostel.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Twilio WhatsApp credentials — set via environment variables or application.properties.
 */
@Configuration
@ConfigurationProperties(prefix = "twilio")
public class TwilioProperties {

    /** When false, messages are logged but not sent (safe for local development). */
    private boolean enabled = false;

    private String accountSid = "";

    private String authToken = "";

    /** Twilio WhatsApp sender, e.g. whatsapp:+14155238886 */
    private String whatsappFrom = "";

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public String getAccountSid() {
        return accountSid;
    }

    public void setAccountSid(String accountSid) {
        this.accountSid = accountSid;
    }

    public String getAuthToken() {
        return authToken;
    }

    public void setAuthToken(String authToken) {
        this.authToken = authToken;
    }

    public String getWhatsappFrom() {
        return whatsappFrom;
    }

    public void setWhatsappFrom(String whatsappFrom) {
        this.whatsappFrom = whatsappFrom;
    }

    public boolean isConfigured() {
        return enabled
                && accountSid != null && !accountSid.isBlank()
                && authToken != null && !authToken.isBlank()
                && whatsappFrom != null && !whatsappFrom.isBlank();
    }
}
