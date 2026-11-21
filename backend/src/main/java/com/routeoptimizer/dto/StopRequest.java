package com.routeoptimizer.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record StopRequest(
        @NotBlank String customerName,
        @NotBlank String address,
        @NotNull Double latitude,
        @NotNull Double longitude,
        String notes
) {}