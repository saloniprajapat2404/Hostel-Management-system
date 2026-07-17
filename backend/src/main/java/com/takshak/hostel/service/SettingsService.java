package com.takshak.hostel.service;

import com.takshak.hostel.dto.PublicConfigDto;
import com.takshak.hostel.dto.SettingDto;
import com.takshak.hostel.dto.UpdateSettingRequest;
import com.takshak.hostel.entity.SystemSetting;
import com.takshak.hostel.exception.ApiException;
import com.takshak.hostel.repository.SystemSettingRepository;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Service;

@Service
public class SettingsService {

    /** Branding keys are seeded in DB and must only be changed via DB / ops tools — not the UI API. */
    private static final Set<String> LOCKED_BRANDING_KEYS = Set.of("hostelName", "systemName");

    private final SystemSettingRepository systemSettingRepository;

    public SettingsService(SystemSettingRepository systemSettingRepository) {
        this.systemSettingRepository = systemSettingRepository;
    }

    public List<SettingDto> list() {
        return systemSettingRepository.findAll().stream()
                .map(s -> new SettingDto(s.getSettingKey(), s.getSettingValue()))
                .toList();
    }

    public PublicConfigDto getPublicConfig() {
        return new PublicConfigDto(
                getValue("hostelName", "Takshak Hostel"),
                getValue("systemName", "Hostel Management System")
        );
    }

    private String getValue(String key, String defaultValue) {
        return systemSettingRepository.findBySettingKey(key)
                .map(SystemSetting::getSettingValue)
                .filter(value -> value != null && !value.isBlank())
                .orElse(defaultValue);
    }

    public SettingDto upsert(UpdateSettingRequest request) {
        assertBrandingNotLocked(request.key());
        SystemSetting setting = systemSettingRepository.findBySettingKey(request.key())
                .orElseGet(() -> new SystemSetting(request.key(), request.value()));
        setting.setSettingValue(request.value());
        setting.setSettingKey(request.key());
        SystemSetting saved = systemSettingRepository.save(setting);
        return new SettingDto(saved.getSettingKey(), saved.getSettingValue());
    }

    public List<SettingDto> upsertMap(Map<String, String> values) {
        return values.entrySet().stream()
                .map(e -> upsert(new UpdateSettingRequest(e.getKey(), e.getValue())))
                .toList();
    }

    private void assertBrandingNotLocked(String key) {
        if (key != null && LOCKED_BRANDING_KEYS.contains(key)) {
            throw new ApiException(
                    "Hostel branding ('" + key + "') is locked. Change it in the database or an admin ops tool.",
                    403
            );
        }
    }
}
