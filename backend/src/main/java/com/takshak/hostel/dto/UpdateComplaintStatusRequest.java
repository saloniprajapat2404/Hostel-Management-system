package com.takshak.hostel.dto;

import com.takshak.hostel.enums.ComplaintStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateComplaintStatusRequest(
        @NotNull ComplaintStatus status
) {
}
