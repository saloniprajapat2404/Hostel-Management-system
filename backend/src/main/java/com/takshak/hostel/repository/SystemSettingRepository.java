package com.takshak.hostel.repository;

import com.takshak.hostel.entity.SystemSetting;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface SystemSettingRepository extends MongoRepository<SystemSetting, String> {
    Optional<SystemSetting> findBySettingKey(String settingKey);
}
