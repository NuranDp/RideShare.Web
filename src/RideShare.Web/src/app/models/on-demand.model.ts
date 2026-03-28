// On-Demand Ride Request Models (Uber-style)

export interface CreateOnDemandRequest {
  pickupLocation: string;
  pickupLat: number;
  pickupLng: number;
  dropoffLocation: string;
  dropoffLat: number;
  dropoffLng: number;
  isScheduled: boolean;
  scheduledTime?: string;
  message?: string;
}

export interface OnDemandRequest {
  id: string;
  passengerId: string;
  passengerName: string;
  passengerPhone?: string;
  passengerPhoto?: string;
  
  // Locations
  pickupLocation: string;
  pickupLat: number;
  pickupLng: number;
  dropoffLocation: string;
  dropoffLat: number;
  dropoffLng: number;
  
  // Timing
  requestedTime: string;
  createdAt: string;
  expiresAt: string;
  
  // Status
  status: OnDemandRequestStatus;
  message?: string;
  
  // Distance (for riders)
  distanceKm?: number;
  
  // Rider info (after acceptance)
  acceptedRiderId?: string;
  riderName?: string;
  riderPhone?: string;
  riderPhoto?: string;
  motorcycleModel?: string;
  plateNumber?: string;
  riderRating?: number;
  acceptedAt?: string;
  
  // Linked ride
  rideId?: string;
}

export type OnDemandRequestStatus = 'Searching' | 'Accepted' | 'Cancelled' | 'Expired' | 'Completed';

export interface NearbyRequest {
  id: string;
  passengerName: string;
  passengerPhoto?: string;
  
  pickupLocation: string;
  pickupLat: number;
  pickupLng: number;
  dropoffLocation: string;
  dropoffLat: number;
  dropoffLng: number;
  
  requestedTime: string;
  expiresAt: string;
  message?: string;
  
  // Distance from rider
  distanceKm: number;
  estimatedRouteKm?: number;
}

export interface NearbyRequestsResponse {
  isRiderVerified: boolean;
  requests: NearbyRequest[];
}
