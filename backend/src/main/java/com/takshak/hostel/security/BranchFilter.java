package com.takshak.hostel.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.takshak.hostel.dto.ApiError;
import com.takshak.hostel.entity.Branch;
import com.takshak.hostel.entity.User;
import com.takshak.hostel.enums.Role;
import com.takshak.hostel.exception.ApiException;
import com.takshak.hostel.repository.BranchRepository;
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
public class BranchFilter extends OncePerRequestFilter {

    private final BranchContext branchContext;
    private final BranchRepository branchRepository;
    private final ObjectMapper objectMapper;

    public BranchFilter(
            BranchContext branchContext,
            BranchRepository branchRepository,
            ObjectMapper objectMapper) {
        this.branchContext = branchContext;
        this.branchRepository = branchRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserPrincipal principal) {
            try {
                resolveBranchContext(principal.getUser(), request.getHeader(BranchContext.BRANCH_HEADER));
            } catch (ApiException ex) {
                writeError(response, request, ex);
                return;
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
                HttpServletResponse.SC_OK == ex.getStatus() ? "Error" : "Error",
                ex.getMessage(),
                request.getRequestURI());
        objectMapper.writeValue(response.getOutputStream(), body);
    }

    private void resolveBranchContext(User user, String branchHeader) {
        if (user.getRole() == Role.SUPER_ADMIN) {
            if (branchHeader != null && !branchHeader.isBlank()) {
                Branch branch = resolveBranch(branchHeader.trim());
                if (branch.getStatus() != com.takshak.hostel.enums.BranchStatus.ACTIVE) {
                    throw new ApiException("Branch is inactive", 400);
                }
                branchContext.setEffectiveBranchId(branch.getId());
            } else {
                branchContext.setOverviewMode(true);
            }
            return;
        }

        if (user.getBranchId() == null || user.getBranchId().isBlank()) {
            throw new ApiException("User is not assigned to a branch", 403);
        }
        branchContext.setEffectiveBranchId(user.getBranchId());
    }

    private Branch resolveBranch(String idOrSlug) {
        return branchRepository.findById(idOrSlug)
                .or(() -> branchRepository.findBySlug(idOrSlug))
                .orElseThrow(() -> new ApiException("Branch not found", 404));
    }
}
