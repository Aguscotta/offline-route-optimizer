package com.routeoptimizer.controller;

import com.routeoptimizer.dto.CreateRouteRequest;
import com.routeoptimizer.dto.UpdateStopRequest;
import com.routeoptimizer.model.Route;
import com.routeoptimizer.model.Stop;
import com.routeoptimizer.service.RouteService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/routes")
public class RouteController {

    private final RouteService routeService;

    public RouteController(RouteService routeService) {
        this.routeService = routeService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Route createRoute(@Valid @RequestBody CreateRouteRequest request) {
        return routeService.createAndOptimizeRoute(request);
    }

    @GetMapping
    public List<Route> getAllRoutes() {
        return routeService.findAll();
    }

    @GetMapping("/{id}")
    public Route getRouteById(@PathVariable Long id) {
        return routeService.findById(id);
    }

    @PatchMapping("/stops/{stopId}")
    public Stop updateStop(@PathVariable Long stopId, @Valid @RequestBody UpdateStopRequest request) {
        return routeService.updateStop(stopId, request);
    }
}