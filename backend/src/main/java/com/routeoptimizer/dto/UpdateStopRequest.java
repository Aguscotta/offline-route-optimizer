package com.routeoptimizer.dto;

import com.routeoptimizer.model.StopStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateStopRequest(
        @NotNull StopStatus status,
        String notes
) {}