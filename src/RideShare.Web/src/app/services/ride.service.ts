import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Ride,
  RideListItem,
  CreateRideRequest,
  UpdateRideRequest,
  RideSearchParams,
  RideRequest,
  MyRideRequest,
  PendingRequestWithRide,
  CreateRideRequestDto,
  CreateRatingRequest,
  Rating,
  RiderTrustScore,
  PassengerRideHistory,
  RideLocation,
  StartRideRequest,
  UpdateLocationRequest,
  PopularRoutesResponse
} from '../models/ride.model';
import { FareCalculationRequest, FareCalculationResponse } from '../models/pricing.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RideService {
  private apiUrl = `${environment.apiUrl}/rides`;

  constructor(private http: HttpClient) {}

  // Get available rides with optional search params
  getAvailableRides(search?: RideSearchParams): Observable<RideListItem[]> {
    let params = new HttpParams();
    if (search?.origin) {
      params = params.set('origin', search.origin);
    }
    if (search?.destination) {
      params = params.set('destination', search.destination);
    }
    if (search?.date) {
      params = params.set('date', search.date);
    }
    if (search?.helmetProvided !== undefined) {
      params = params.set('helmetProvided', search.helmetProvided.toString());
    }
    return this.http.get<RideListItem[]>(this.apiUrl, { params });
  }

  // Get ride details by ID
  getRide(id: string): Observable<Ride> {
    return this.http.get<Ride>(`${this.apiUrl}/${id}`);
  }

  // Create a new ride (Rider only)
  createRide(request: CreateRideRequest): Observable<Ride> {
    return this.http.post<Ride>(this.apiUrl, request);
  }

  // Get my posted rides (Rider)
  getMyPostedRides(): Observable<Ride[]> {
    return this.http.get<Ride[]>(`${this.apiUrl}/my-rides`);
  }

  // Update ride (Rider - owner only)
  updateRide(id: string, request: UpdateRideRequest): Observable<Ride> {
    return this.http.put<Ride>(`${this.apiUrl}/${id}`, request);
  }

  // Cancel ride (Rider - owner only)
  cancelRide(id: string): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.apiUrl}/${id}/cancel`, {});
  }

  // Complete ride (Rider - owner only)
  completeRide(id: string): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.apiUrl}/${id}/complete`, {});
  }

  // Request to join a ride (Passenger)
  requestToJoin(rideId: string, request: CreateRideRequestDto): Observable<RideRequest> {
    return this.http.post<RideRequest>(`${this.apiUrl}/${rideId}/request`, request);
  }

  // Get requests for a specific ride (Rider - owner)
  getRideRequests(rideId: string): Observable<RideRequest[]> {
    return this.http.get<RideRequest[]>(`${this.apiUrl}/${rideId}/requests`);
  }

  // Get my requests (Passenger)
  getMyRequests(): Observable<MyRideRequest[]> {
    return this.http.get<MyRideRequest[]>(`${this.apiUrl}/my-requests`);
  }

  // Get all pending requests for my rides (Rider)
  getMyPendingRequests(): Observable<PendingRequestWithRide[]> {
    return this.http.get<PendingRequestWithRide[]>(`${this.apiUrl}/my-pending-requests`);
  }

  // Accept a request (Rider)
  acceptRequest(requestId: string): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.apiUrl}/requests/${requestId}/accept`, {});
  }

  // Reject a request (Rider)
  rejectRequest(requestId: string): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.apiUrl}/requests/${requestId}/reject`, {});
  }

  // Cancel my request (Passenger)
  cancelMyRequest(requestId: string): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.apiUrl}/requests/${requestId}/cancel`, {});
  }

  // Rate a rider after completing a ride (Passenger)
  rateRider(rideId: string, request: CreateRatingRequest): Observable<Rating> {
    return this.http.post<Rating>(`${this.apiUrl}/${rideId}/rate`, request);
  }

  // Check if user has already rated a ride
  hasRatedRide(rideId: string): Observable<{ hasRated: boolean }> {
    return this.http.get<{ hasRated: boolean }>(`${this.apiUrl}/${rideId}/has-rated`);
  }

  // Get ratings for a specific rider
  getRiderRatings(riderId: string): Observable<Rating[]> {
    return this.http.get<Rating[]>(`${this.apiUrl}/rider/${riderId}/ratings`);
  }

  // Get trust score for a rider
  getRiderTrustScore(riderId: string): Observable<RiderTrustScore> {
    return this.http.get<RiderTrustScore>(`${this.apiUrl}/rider/${riderId}/trust-score`);
  }

  // Get passenger's ride history
  getMyRideHistory(): Observable<PassengerRideHistory[]> {
    return this.http.get<PassengerRideHistory[]>(`${this.apiUrl}/my-history`);
  }

  // Start a ride (Rider - changes status from Booked to InProgress)
  startRide(rideId: string, request: StartRideRequest): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.apiUrl}/${rideId}/start`, request);
  }

  // Update rider's current location during an active ride (Rider)
  updateLocation(rideId: string, request: UpdateLocationRequest): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.apiUrl}/${rideId}/location`, request);
  }

  // Get current location of a ride (for live tracking)
  getRideLocation(rideId: string): Observable<RideLocation> {
    return this.http.get<RideLocation>(`${this.apiUrl}/${rideId}/location`);
  }

  // Get popular routes with traffic consideration
  getPopularRoutes(limit: number = 10): Observable<PopularRoutesResponse> {
    return this.http.get<PopularRoutesResponse>(`${this.apiUrl}/popular-routes`, {
      params: { limit: limit.toString() }
    });
  }

  // Calculate fare for a route
  calculateFare(request: FareCalculationRequest): Observable<FareCalculationResponse> {
    return this.http.post<FareCalculationResponse>(`${this.apiUrl}/pricing/calculate`, request);
  }
}
