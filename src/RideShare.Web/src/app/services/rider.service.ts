import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  RiderProfile,
  SubmitLicenseRequest,
  UpdateRiderProfileRequest,
  PublicRiderProfile
} from '../models/rider.model';

@Injectable({
  providedIn: 'root'
})
export class RiderService {
  private readonly apiUrl = `${environment.apiUrl}/rider`;

  constructor(private http: HttpClient) {}

  getMyProfile(): Observable<RiderProfile> {
    return this.http.get<RiderProfile>(`${this.apiUrl}/profile`);
  }

  updateProfile(request: UpdateRiderProfileRequest): Observable<RiderProfile> {
    return this.http.put<RiderProfile>(`${this.apiUrl}/profile`, request);
  }

  submitLicense(request: SubmitLicenseRequest): Observable<{ message: string; profile: RiderProfile }> {
    return this.http.post<{ message: string; profile: RiderProfile }>(`${this.apiUrl}/license`, request);
  }

  getPublicProfile(riderId: string): Observable<PublicRiderProfile> {
    return this.http.get<PublicRiderProfile>(`${this.apiUrl}/${riderId}/public`);
  }
}
