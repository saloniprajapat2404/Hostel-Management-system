package com.takshak.hostel.security;

import com.takshak.hostel.entity.User;
import com.takshak.hostel.enums.Role;
import com.takshak.hostel.exception.ApiException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class ScreenPermissionService {

    public static final List<String> MODULE_KEYS = List.of(
            "DASHBOARD",
            "STUDENTS",
            "HOSTEL",
            "ROOMS",
            "NOTICES",
            "COMPLAINTS",
            "ATTENDANCE",
            "FEES",
            "REPORTS",
            "SETTINGS");

    public Map<String, Boolean> defaultPermissions() {
        Map<String, Boolean> defaults = new LinkedHashMap<>();
        for (String key : MODULE_KEYS) {
            defaults.put(key, true);
        }
        return defaults;
    }

    /** Merge admin overrides onto module defaults so every key is persisted. */
    public Map<String, Boolean> mergeWithDefaults(Map<String, Boolean> overrides) {
        Map<String, Boolean> merged = defaultPermissions();
        if (overrides != null) {
            merged.putAll(overrides);
            if (overrides.containsKey("VISITORS") && !overrides.containsKey("NOTICES")) {
                merged.put("NOTICES", overrides.get("VISITORS"));
            }
            if (!overrides.containsKey("NOTICES") && overrides.containsKey("COMPLAINTS")) {
                merged.put("NOTICES", overrides.get("COMPLAINTS"));
            }
            merged.remove("VISITORS");
        }
        return merged;
    }

    public boolean usesCustomPermissions(User user) {
        return user != null
                && user.getScreenPermissions() != null
                && !user.getScreenPermissions().isEmpty();
    }

    public boolean isModuleEnabled(User user, String moduleKey) {
        if (user == null || moduleKey == null) {
            return false;
        }
        if (!usesCustomPermissions(user)) {
            return true;
        }
        return !Boolean.FALSE.equals(user.getScreenPermissions().get(moduleKey));
    }

    public boolean hasAccessGrant(User user) {
        if (user == null) {
            return false;
        }
        if (!usesCustomPermissions(user)) {
            return user.getRole() == Role.SUPER_ADMIN || user.getRole() == Role.ADMIN;
        }
        return user.isAccessGrant();
    }

    public void assertModuleAccess(User user, String moduleKey) {
        if (moduleKey == null) {
            return;
        }
        if ("ACCESS_GRANT".equals(moduleKey)) {
            if (!hasAccessGrant(user)) {
                throw new ApiException("Access denied for this module", 403);
            }
            return;
        }
        if (!isModuleEnabled(user, moduleKey)) {
            throw new ApiException("Access denied for this module", 403);
        }
    }

    public String resolveModuleForPath(String uri, String method) {
        if (uri == null) {
            return null;
        }
        String path = uri.split("\\?")[0];

        if (path.startsWith("/api/auth")
                || path.startsWith("/api/health")
                || path.startsWith("/api/config")
                || path.startsWith("/api/branches")
                || path.startsWith("/api/superadmin")) {
            return null;
        }

        if (path.startsWith("/api/users/me/fees")) {
            return "FEES";
        }
        if (path.startsWith("/api/users/me/profile")) {
            return "SETTINGS";
        }
        if (path.startsWith("/api/users")) {
            if ("POST".equalsIgnoreCase(method)) {
                return "ACCESS_GRANT";
            }
            return "STUDENTS";
        }
        if (path.startsWith("/api/dashboard")) {
            return "DASHBOARD";
        }
        if (path.startsWith("/api/rooms")) {
            return "ROOMS";
        }
        if (path.startsWith("/api/admissions") || path.startsWith("/api/allocations")) {
            return "HOSTEL";
        }
        if (path.startsWith("/api/complaints")) {
            return "COMPLAINTS";
        }
        if (path.startsWith("/api/notices")) {
            return "NOTICES";
        }
        if (path.startsWith("/api/attendance") || path.startsWith("/api/check-in-out")) {
            return "ATTENDANCE";
        }
        if (path.startsWith("/api/fees") || path.startsWith("/api/expenses")) {
            return "FEES";
        }
        if (path.startsWith("/api/reports") || path.startsWith("/api/activity")) {
            return "REPORTS";
        }
        if (path.startsWith("/api/settings")) {
            return "SETTINGS";
        }
        if (path.startsWith("/api/notifications")) {
            return "SETTINGS";
        }
        return null;
    }
}
