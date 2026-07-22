package com.takshak.hostel.security;

import com.takshak.hostel.exception.ApiException;
import java.util.Optional;
import org.springframework.stereotype.Component;

@Component
public class BranchScope {

    private final BranchContext branchContext;

    public BranchScope(BranchContext branchContext) {
        this.branchContext = branchContext;
    }

    public String requireBranchId() {
        String branchId = branchContext.getEffectiveBranchId();
        if (branchId == null || branchId.isBlank()) {
            throw new ApiException("Branch context is required. Select a branch to continue.", 400);
        }
        return branchId;
    }

    public Optional<String> optionalBranchId() {
        return Optional.ofNullable(branchContext.getEffectiveBranchId())
                .filter(id -> !id.isBlank());
    }

    public boolean isOverviewMode() {
        return branchContext.isOverviewMode();
    }
}
