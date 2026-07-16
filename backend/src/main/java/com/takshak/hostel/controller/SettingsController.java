package com.takshak.hostel.controller;

import com.takshak.hostel.dto.SettingDto;
import com.takshak.hostel.dto.UpdateSettingRequest;
import com.takshak.hostel.service.SettingsService;
import java.util.List;
import java.util.Map;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/settings")
public class SettingsController {

    private final SettingsService settingsService;

    public SettingsController(SettingsService settingsService) {
        this.settingsService = settingsService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public List<SettingDto> list() {
        return settingsService.list();
    }

    @PutMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public Object upsert(@RequestBody Map<String, Object> body) {
        if (body.containsKey("key") && body.containsKey("value")) {
            return settingsService.upsert(new UpdateSettingRequest(
                    String.valueOf(body.get("key")),
                    String.valueOf(body.get("value"))
            ));
        }
        Map<String, String> map = body.entrySet().stream()
                .collect(java.util.stream.Collectors.toMap(
                        Map.Entry::getKey,
                        e -> String.valueOf(e.getValue())
                ));
        return settingsService.upsertMap(map);
    }
}
