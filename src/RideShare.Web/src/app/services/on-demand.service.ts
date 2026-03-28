import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, map } from 'rxjs';
import { 
  OnDemandRequest, 
  CreateOnDemandRequest, 
  NearbyRequest,
  NearbyRequestsResponse 
} from '../models/on-demand.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OnDemandService {
  private apiUrl = `${environment.apiUrl}/on-demand`;

  // Reactive state for passenger's active request
  private _activeRequest = signal<OnDemandRequest | null>(null);
  private _myRequests = signal<OnDemandRequest[]>([]);
  private _nearbyRequests = signal<NearbyRequest[]>([]);
  private _isAvailable = signal(false);

  // Public signals
  readonly activeRequest = this._activeRequest.asReadonly();
  readonly myRequests = this._myRequests.asReadonly();
  readonly nearbyRequests = this._nearbyRequests.asReadonly();
  readonly isAvailable = this._isAvailable.asReadonly();

  // Computed signals
  readonly hasActiveRequest = computed(() => {
    const active = this._activeRequest();
    return active !== null && active.status === 'Searching';
  });

  readonly nearbyRequestCount = computed(() => this._nearbyRequests().length);

  constructor(private http: HttpClient) {}

  // ===== Passenger Operations =====

  /**
   * Create a new on-demand ride request
   */
  createRequest(request: CreateOnDemandRequest): Observable<OnDemandRequest> {
    return this.http.post<OnDemandRequest>(`${this.apiUrl}/request`, request).pipe(
      tap(result => {
        this._activeRequest.set(result);
        this._myRequests.update(requests => [result, ...requests]);
      })
    );
  }

  /**
   * Get passenger's on-demand requests
   */
  getMyRequests(): Observable<OnDemandRequest[]> {
    return this.http.get<OnDemandRequest[]>(`${this.apiUrl}/my-requests`).pipe(
      tap(requests => {
        this._myRequests.set(requests);
        // Set active request if there's one still searching
        const active = requests.find(r => r.status === 'Searching');
        this._activeRequest.set(active || null);
      })
    );
  }

  /**
   * Get a specific request by ID
   */
  getRequest(id: string): Observable<OnDemandRequest> {
    return this.http.get<OnDemandRequest>(`${this.apiUrl}/request/${id}`);
  }

  /**
   * Cancel an on-demand request
   */
  cancelRequest(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/request/${id}`).pipe(
      tap(() => {
        this._activeRequest.set(null);
        this._myRequests.update(requests => 
          requests.map(r => r.id === id ? { ...r, status: 'Cancelled' as const } : r)
        );
      })
    );
  }

  // ===== Rider Operations =====

  /**
   * Get nearby on-demand requests (for riders)
   * Returns response with verification status and requests
   */
  getNearbyRequests(lat: number, lng: number, radiusKm: number = 10): Observable<NearbyRequestsResponse> {
    const params = new HttpParams()
      .set('lat', lat.toString())
      .set('lng', lng.toString())
      .set('radiusKm', radiusKm.toString());

    return this.http.get<NearbyRequestsResponse>(`${this.apiUrl}/nearby`, { params }).pipe(
      tap(response => this._nearbyRequests.set(response.requests))
    );
  }

  /**
   * Get rider's accepted on-demand requests (history)
   */
  getMyAcceptedRequests(): Observable<OnDemandRequest[]> {
    return this.http.get<OnDemandRequest[]>(`${this.apiUrl}/my-accepted`);
  }

  /**
   * Accept an on-demand request (for riders)
   */
  acceptRequest(id: string): Observable<OnDemandRequest> {
    return this.http.post<OnDemandRequest>(`${this.apiUrl}/request/${id}/accept`, {}).pipe(
      tap(() => {
        // Remove from nearby requests
        this._nearbyRequests.update(requests => requests.filter(r => r.id !== id));
      })
    );
  }

  /**
   * Set rider availability status
   */
  setAvailable(available: boolean): void {
    console.log('[OnDemandService] setAvailable called:', available);
    this._isAvailable.set(available);
    // Also store in localStorage for persistence and popup component access
    localStorage.setItem('riderAvailable', available.toString());
  }

  /**
   * Check if rider is available (also checks localStorage)
   */
  checkAvailability(): boolean {
    const stored = localStorage.getItem('riderAvailable');
    return stored === 'true';
  }

  /**
   * Update active request from notification
   */
  updateActiveRequest(request: OnDemandRequest): void {
    this._activeRequest.set(request);
    this._myRequests.update(requests => {
      const index = requests.findIndex(r => r.id === request.id);
      if (index >= 0) {
        requests[index] = request;
        return [...requests];
      }
      return [request, ...requests];
    });
  }

  /**
   * Add new nearby request from notification
   */
  addNearbyRequest(request: NearbyRequest): void {
    this._nearbyRequests.update(requests => {
      // Don't add duplicates
      if (requests.some(r => r.id === request.id)) {
        return requests;
      }
      return [request, ...requests];
    });
  }

  /**
   * Remove a nearby request (e.g., when it's accepted by another rider)
   */
  removeNearbyRequest(id: string): void {
    this._nearbyRequests.update(requests => requests.filter(r => r.id !== id));
  }

  /**
   * Clear state on logout
   */
  clearState(): void {
    this._activeRequest.set(null);
    this._myRequests.set([]);
    this._nearbyRequests.set([]);
    this._isAvailable.set(false);
  }
}
