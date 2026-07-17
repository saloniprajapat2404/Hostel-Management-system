package com.takshak.hostel.controller;

import com.takshak.hostel.dto.PublicConfigDto;
import com.takshak.hostel.service.SettingsService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/config")
public class ConfigController {

    private final SettingsService settingsService;

    public ConfigController(SettingsService settingsService) {
        this.settingsService = settingsService;
    }

    @GetMapping("/public")
    public PublicConfigDto publicConfig() {
        return settingsService.getPublicConfig();
    }
}
