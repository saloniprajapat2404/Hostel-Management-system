package com.takshak.hostel.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.takshak.hostel.dto.ApiError;
import com.takshak.hostel.entity.User;
import com.takshak.hostel.exception.ApiException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Instant;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class ScreenPermissionFilter extends OncePerRequestFilter {

    private final ScreenPermissionService screenPermissionService;
    private final ObjectMapper objectMapper;

    public ScreenPermissionFilter(
            ScreenPermissionService screenPermissionService,
            ObjectMapper objectMapper) {
        this.screenPermissionService = screenPermissionService;
        this.objectMapper = objectMapper;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserPrincipal principal) {
            User user = principal.getUser();
            if (screenPermissionService.usesCustomPermissions(user)) {
                try {
                    String module = screenPermissionService.resolveModuleForPath(
                            request.getRequestURI(),
                            request.getMethod());
                    screenPermissionService.assertModuleAccess(user, module);
                } catch (ApiException ex) {
                    writeError(response, request, ex);
                    return;
                }
            }
        }
        filterChain.doFilter(request, response);
    }

    private void writeError(HttpServletResponse response, HttpServletRequest request, ApiException ex)
            throws IOException {
        response.setStatus(ex.getStatus());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        ApiError body = new ApiError(
                Instant.now(),
                ex.getStatus(),
                "Error",
                ex.getMessage(),
                request.getRequestURI());
        objectMapper.writeValue(response.getOutputStream(), body);
    }
}
