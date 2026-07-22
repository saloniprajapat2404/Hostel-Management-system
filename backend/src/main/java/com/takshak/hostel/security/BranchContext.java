package com.takshak.hostel.security;

import org.springframework.stereotype.Component;
import org.springframework.web.context.annotation.RequestScope;

@Component
@RequestScope
public class BranchContext {

    public static final String BRANCH_HEADER = "X-Branch-Id";

    private String effectiveBranchId;
    private boolean overviewMode;

    public String getEffectiveBranchId() {
        return effectiveBranchId;
    }

    public void setEffectiveBranchId(String effectiveBranchId) {
        this.effectiveBranchId = effectiveBranchId;
        this.overviewMode = false;
    }

    public boolean isOverviewMode() {
        return overviewMode;
    }

    public void setOverviewMode(boolean overviewMode) {
        this.overviewMode = overviewMode;
        if (overviewMode) {
            this.effectiveBranchId = null;
        }
    }
}
