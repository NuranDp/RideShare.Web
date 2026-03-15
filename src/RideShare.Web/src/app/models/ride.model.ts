export interface Ride {
  id: string;
  riderId: string;
  riderName: string;
  riderPhone?: string;
  riderPhoto?: string;
  motorcycleModel?: string;
  plateNumber?: string;
  riderRating: number;
  riderTotalRides: number;
  origin: string;
  destination: string;
  originLat?: number;
  originLng?: number;
  destLat?: number;
  destLng?: number;
  departureTime: string;
  helmetProvided: boolean;
  notes?: string;
  status: RideStatus;
  createdAt: string;
  requestCount: number;
}

export interface RideListItem {
  id: string;
  riderName: string;
  riderPhoto?: string;
  riderRating: number;
  origin: string;
  destination: string;
  originLat?: number;
  originLng?: number;
  destLat?: number;
  destLng?: number;
  departureTime: string;
  helmetProvided: boolean;
  status: RideStatus;
  createdAt: string;
}

export interface AcceptedPassengerInfo {
  passengerId: string;
  passengerName: string;
  passengerPhone: string;
  passengerEmail: string;
}

export interface CreateRideRequest {
  origin: string;
  destination: string;
  originLat?: number;
  originLng?: number;
  destLat?: number;
  destLng?: number;
  departureTime: string;
  helmetProvided: boolean;
  notes?: string;
}

export interface UpdateRideRequest {
  origin?: string;
  destination?: string;
  departureTime?: string;
  helmetProvided?: boolean;
  notes?: string;
}

export interface RideSearchParams {
  origin?: string;
  destination?: string;
  date?: string;
  helmetProvided?: boolean;
}

export interface RideRequest {
  id: string;
  rideId: string;
  passengerId: string;
  passengerName: string;
  passengerPhone?: string;
  passengerPhoto?: string;
  message?: string;
  pickupLocation?: string;
  pickupLat?: number;
  pickupLng?: number;
  dropoffLocation?: string;
  dropoffLat?: number;
  dropoffLng?: number;
  status: RequestStatus;
  createdAt: string;
}

export interface MyRideRequest {
  id: string;
  rideId: string;
  riderId: string;
  riderName: string;
  riderPhone?: string;
  origin: string;
  destination: string;
  pickupLocation?: string;
  pickupLat?: number;
  pickupLng?: number;
  dropoffLocation?: string;
  dropoffLat?: number;
  dropoffLng?: number;
  departureTime: string;
  message?: string;
  status: RequestStatus;
  rideStatus: RideStatus;
  hasRated: boolean;
  createdAt: string;
}

export interface PendingRequestWithRide {
  id: string;
  rideId: string;
  passengerId: string;
  passengerName: string;
  passengerPhone?: string;
  passengerPhoto?: string;
  message?: string;
  pickupLocation?: string;
  pickupLat?: number;
  pickupLng?: number;
  dropoffLocation?: string;
  dropoffLat?: number;
  dropoffLng?: number;
  requestedAt: string;
  rideOrigin: string;
  rideDestination: string;
  rideOriginLat?: number;
  rideOriginLng?: number;
  rideDestLat?: number;
  rideDestLng?: number;
  departureTime: string;
}

export interface CreateRideRequestDto {
  message?: string;
  pickupLocation?: string;
  pickupLat?: number;
  pickupLng?: number;
  dropoffLocation?: string;
  dropoffLat?: number;
  dropoffLng?: number;
}

// Rating models
export interface CreateRatingRequest {
  score: number; // 1-5 stars
  comment?: string;
}

export interface Rating {
  id: string;
  rideId: string;
  riderId: string;
  riderName: string;
  passengerId: string;
  passengerName: string;
  score: number;
  comment?: string;
  createdAt: string;
}

export interface RiderTrustScore {
  isVerified: boolean;
  totalRides: number;
  totalRatings: number;
  averageRating: number;
}

export interface PassengerRideHistory {
  rideId: string;
  riderId: string;
  riderName: string;
  riderPhone?: string;
  riderRating: number;
  origin: string;
  destination: string;
  departureTime: string;
  rideStatus: RideStatus;
  helmetProvided: boolean;
  hasRated: boolean;
  myRating?: number;
  completedAt: string;
}

export interface RideLocation {
  rideId: string;
  riderName: string;
  riderPhone?: string;
  vehicleNumber?: string;
  vehicleModel?: string;
  origin: string;
  destination: string;
  originLat?: number;
  originLng?: number;
  destLat?: number;
  destLng?: number;
  currentLat?: number;
  currentLng?: number;
  locationUpdatedAt?: string;
  startedAt?: string;
  status: RideStatus;
}

export interface StartRideRequest {
  lat: number;
  lng: number;
}

export interface UpdateLocationRequest {
  lat: number;
  lng: number;
}

export interface LocationUpdate {
  rideId: string;
  lat: number;
  lng: number;
  timestamp: string;
}

export type RideStatus = 'Active' | 'Booked' | 'InProgress' | 'Completed' | 'Cancelled';
export type RequestStatus = 'Pending' | 'Accepted' | 'Rejected' | 'Cancelled';

// Popular routes with traffic consideration
export interface PopularRoute {
  origin: string;
  destination: string;
  originLat?: number;
  originLng?: number;
  destLat?: number;
  destLng?: number;
  totalRides: number;
  completedRides: number;
  popularityScore: number;
  peakTimeSlot: string;
  trafficLevel: string;
  recommendedTime: string;
}

export interface PopularRoutesResponse {
  routes: PopularRoute[];
  currentTimeSlot: string;
  currentTrafficLevel: string;
}
