package com.routeoptimizer.service;

import com.routeoptimizer.dto.CreateRouteRequest;
import com.routeoptimizer.dto.StopRequest;
import com.routeoptimizer.dto.UpdateStopRequest;
import com.routeoptimizer.model.Route;
import com.routeoptimizer.model.Stop;
import com.routeoptimizer.repository.RouteRepository;
import com.routeoptimizer.repository.StopRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
public class RouteService {

    private static final double EARTH_RADIUS_KM = 6371.0;

    private final RouteRepository routeRepository;
    private final StopRepository stopRepository;

    public RouteService(RouteRepository routeRepository, StopRepository stopRepository) {
        this.routeRepository = routeRepository;
        this.stopRepository = stopRepository;
    }

    @Transactional
    public Route createAndOptimizeRoute(CreateRouteRequest request) {
        List<Stop> stops = new ArrayList<>();
        for (StopRequest req : request.stops()) {
            Stop stop = new Stop();
            stop.setCustomerName(req.customerName());
            stop.setAddress(req.address());
            stop.setLatitude(req.latitude());
            stop.setLongitude(req.longitude());
            stop.setNotes(req.notes());
            stops.add(stop);
        }

        List<Stop> optimized = optimizeStops(stops);

        Route route = new Route(request.name());
        for (int i = 0; i < optimized.size(); i++) {
            Stop stop = optimized.get(i);
            stop.setSequenceOrder(i + 1);
            route.addStop(stop);
        }

        double totalKm = calculateTotalDistance(optimized);
        route.setTotalDistanceKm(Math.round(totalKm * 100.0) / 100.0);

        return routeRepository.save(route);
    }

    public List<Route> findAll() {
        return routeRepository.findAll();
    }

    public Route findById(Long id) {
        return routeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ruta no encontrada: " + id));
    }

    @Transactional
    public Stop updateStop(Long stopId, UpdateStopRequest request) {
        Stop stop = stopRepository.findById(stopId)
                .orElseThrow(() -> new RuntimeException("Parada no encontrada: " + stopId));
        stop.setStatus(request.status());
        if (request.notes() != null) {
            stop.setNotes(request.notes());
        }
        return stopRepository.save(stop);
    }

    // --- Algoritmo: Vecino Más Cercano + Mejora 2-opt ---

    private List<Stop> optimizeStops(List<Stop> stops) {
        if (stops.size() <= 2) {
            return new ArrayList<>(stops);
        }

        // 1. Vecino Más Cercano (partiendo de la parada 0)
        List<Stop> unvisited = new ArrayList<>(stops);
        List<Stop> route = new ArrayList<>();
        Stop current = unvisited.remove(0);
        route.add(current);

        while (!unvisited.isEmpty()) {
            Stop nearest = null;
            double minDistance = Double.MAX_VALUE;
            for (Stop candidate : unvisited) {
                double dist = haversine(current, candidate);
                if (dist < minDistance) {
                    minDistance = dist;
                    nearest = candidate;
                }
            }
            route.add(nearest);
            unvisited.remove(nearest);
            current = nearest;
        }

        // 2. Mejora 2-opt (elimina cruces en el recorrido)
        boolean improved = true;
        while (improved) {
            improved = false;
            for (int i = 1; i < route.size() - 2; i++) {
                for (int j = i + 1; j < route.size() - 1; j++) {
                    double currentDist = haversine(route.get(i - 1), route.get(i))
                            + haversine(route.get(j), route.get(j + 1));
                    double newDist = haversine(route.get(i - 1), route.get(j))
                            + haversine(route.get(i), route.get(j + 1));

                    if (newDist < currentDist) {
                        Collections.reverse(route.subList(i, j + 1));
                        improved = true;
                    }
                }
            }
        }

        return route;
    }

    private double calculateTotalDistance(List<Stop> stops) {
        double total = 0.0;
        for (int i = 0; i < stops.size() - 1; i++) {
            total += haversine(stops.get(i), stops.get(i + 1));
        }
        return total;
    }

    private double haversine(Stop a, Stop b) {
        double dLat = Math.toRadians(b.getLatitude() - a.getLatitude());
        double dLon = Math.toRadians(b.getLongitude() - a.getLongitude());
        double lat1 = Math.toRadians(a.getLatitude());
        double lat2 = Math.toRadians(b.getLatitude());

        double h = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(lat1) * Math.cos(lat2)
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);

        return 2 * EARTH_RADIUS_KM * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
    }
}