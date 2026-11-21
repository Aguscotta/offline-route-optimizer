import { Component, AfterViewInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';
import { RouteService } from '../../core/services/route.service';
import { Route, Stop } from '../../shared/models/route.model';

@Component({
  selector: 'app-route-map',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './route-map.component.html'
})
export class RouteMapComponent implements AfterViewInit {
  private routeService = inject(RouteService);

  private map!: L.Map;
  private markersLayer = L.layerGroup();
  private routeLine?: L.Polyline;

  routeName = signal('Reparto del día');
  stops = signal<Stop[]>([]);
  savedRoute = signal<Route | null>(null);
  isOptimizing = signal(false);

  ngAfterViewInit(): void {
    this.initMap();
  }

  private initMap(): void {
    // Centrado inicial en Santa Fe (podés cambiar las coordenadas)
    this.map = L.map('map').setView([-31.6333, -60.7000], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);

    this.markersLayer.addTo(this.map);

    // Al hacer clic en el mapa, agregamos una nueva parada
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      if (this.savedRoute()) return; // Si ya está optimizada, no agregamos más a esta

      const index = this.stops().length + 1;
      const newStop: Stop = {
        customerName: index === 1 ? 'Depósito (Inicio)' : `Cliente #${index - 1}`,
        address: `${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}`,
        latitude: e.latlng.lat,
        longitude: e.latlng.lng,
        status: 'PENDING'
      };

      this.stops.update(list => [...list, newStop]);
      this.renderMarkers();
    });
  }

  optimizeRoute(): void {
    if (this.stops().length < 2) return;
    this.isOptimizing.set(true);

    const payload = {
      name: this.routeName(),
      stops: this.stops().map(s => ({
        customerName: s.customerName,
        address: s.address,
        latitude: s.latitude,
        longitude: s.longitude,
        notes: s.notes
      }))
    };

    this.routeService.createAndOptimize(payload).subscribe({
      next: (route) => {
        this.savedRoute.set(route);
        this.stops.set(route.stops);
        this.renderMarkers();
        this.drawRoutePath(route.stops);
        this.isOptimizing.set(false);
      },
      error: (err) => {
        console.error('Error al optimizar:', err);
        this.isOptimizing.set(false);
      }
    });
  }

  toggleStopStatus(stop: Stop): void {
    if (!stop.id) return;
    const nextStatus = stop.status === 'DELIVERED' ? 'PENDING' : 'DELIVERED';

    this.routeService.updateStopStatus(stop.id, nextStatus, stop.notes).subscribe({
      next: (updated) => {
        this.stops.update(list =>
          list.map(s => (s.id === updated.id ? updated : s))
        );
        this.renderMarkers();
      }
    });
  }

  clearAll(): void {
    this.stops.set([]);
    this.savedRoute.set(null);
    this.markersLayer.clearLayers();
    if (this.routeLine) {
      this.map.removeLayer(this.routeLine);
      this.routeLine = undefined;
    }
  }

  private renderMarkers(): void {
    this.markersLayer.clearLayers();

    this.stops().forEach((stop, idx) => {
      const num = stop.sequenceOrder ?? idx + 1;
      const bgColor = stop.status === 'DELIVERED'
        ? '#16a34a' // verde entregado
        : num === 1 ? '#0f172a' : '#2563eb'; // negro inicio / azul pendiente

      const icon = L.divIcon({
        className: 'custom-pin',
        html: `<div style="background:${bgColor};color:white;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4);">${num}</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      L.marker([stop.latitude, stop.longitude], { icon })
        .bindPopup(`<b>${num}. ${stop.customerName}</b><br>${stop.address}`)
        .addTo(this.markersLayer);
    });
  }

  private drawRoutePath(orderedStops: Stop[]): void {
    if (this.routeLine) {
      this.map.removeLayer(this.routeLine);
    }

    this.routeService.getStreetGeometry(orderedStops).subscribe(streetCoords => {
      const path = streetCoords && streetCoords.length > 0
        ? streetCoords
        : orderedStops.map(s => [s.latitude, s.longitude] as [number, number]);

      this.routeLine = L.polyline(path, {
        color: '#2563eb',
        weight: 4,
        opacity: 0.85
      }).addTo(this.map);

      this.map.fitBounds(this.routeLine.getBounds(), { padding: [40, 40] });
    });
  }
}
