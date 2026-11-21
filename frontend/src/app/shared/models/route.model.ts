export type StopStatus = 'PENDING' | 'DELIVERED' | 'FAILED';

export interface Stop {
  id?: number;
  customerName: string;
  address: string;
  latitude: number;
  longitude: number;
  sequenceOrder?: number;
  status: StopStatus;
  notes?: string;
}

export interface Route {
  id?: number;
  name: string;
  totalDistanceKm?: number;
  createdAt?: string;
  stops: Stop[];
}

export interface CreateRouteRequest {
  name: string;
  stops: {
    customerName: string;
    address: string;
    latitude: number;
    longitude: number;
    notes?: string;
  }[];
}
