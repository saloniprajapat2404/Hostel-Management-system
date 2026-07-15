package com.takshak.hostel.security;

import com.takshak.hostel.entity.User;
import com.takshak.hostel.exception.ApiException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public final class SecurityUtils {

    private SecurityUtils() {
    }

    public static UserPrincipal currentPrincipal() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof UserPrincipal principal)) {
            throw new ApiException("Unauthorized", 401);
        }
        return principal;
    }

    public static User currentUser() {
        return currentPrincipal().getUser();
    }
}
