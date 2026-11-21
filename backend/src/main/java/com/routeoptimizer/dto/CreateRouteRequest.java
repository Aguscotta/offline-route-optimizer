package com.routeoptimizer.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record CreateRouteRequest(
        @NotBlank String name,
        @NotEmpty @Valid List<StopRequest> stops
) {}