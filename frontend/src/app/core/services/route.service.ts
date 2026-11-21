import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { CreateRouteRequest, Route, Stop, StopStatus } from '../../shared/models/route.model';

@Injectable({
  providedIn: 'root'
})
export class RouteService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/routes';

  createAndOptimize(request: CreateRouteRequest): Observable<Route> {
    return this.http.post<Route>(this.apiUrl, request);
  }

  getAllRoutes(): Observable<Route[]> {
    return this.http.get<Route[]>(this.apiUrl);
  }

  updateStopStatus(stopId: number, status: StopStatus, notes?: string): Observable<Stop> {
    return this.http.patch<Stop>(`${this.apiUrl}/stops/${stopId}`, { status, notes });
  }

  /**
   * Consulta OSRM para obtener la geometría real por calles.
   * Si falla (ej. sin internet), devuelve null para usar líneas rectas.
   */
  getStreetGeometry(stops: Stop[]): Observable<[number, number][] | null> {
    if (stops.length < 2) return of(null);

    const coords = stops.map(s => `${s.longitude},${s.latitude}`).join(';');
    const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;

    return this.http.get<any>(url).pipe(
      map(res => {
        const geoCoords: [number, number][] = res.routes?.[0]?.geometry?.coordinates ?? [];
        // OSRM devuelve [lng, lat], Leaflet usa [lat, lng]
        return geoCoords.map(([lng, lat]) => [lat, lng] as [number, number]);
      }),
      catchError(() => of(null))
    );
  }
}
