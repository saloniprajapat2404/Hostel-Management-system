package com.takshak.hostel.controller;

import com.takshak.hostel.service.SettingsService;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/health")
public class HealthController {

    private final SettingsService settingsService;

    public HealthController(SettingsService settingsService) {
        this.settingsService = settingsService;
    }

    @GetMapping
    public Map<String, String> health() {
        var config = settingsService.getPublicConfig();
        Map<String, String> body = new LinkedHashMap<>();
        body.put("status", "UP");
        body.put("service", config.hostelName() + " Management");
        body.put("hostelName", config.hostelName());
        body.put("systemName", config.systemName());
        return body;
    }
}
