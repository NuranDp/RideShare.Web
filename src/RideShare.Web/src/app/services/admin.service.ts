import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  AdminStats,
  LicenseVerificationItem,
  LicenseVerificationRequest,
  AdminUserListItem
} from '../models/rider.model';
import { PricingSettings, UpdatePricingSettingsRequest } from '../models/pricing.model';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private readonly apiUrl = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) {}

  getStats(): Observable<AdminStats> {
    return this.http.get<AdminStats>(`${this.apiUrl}/stats`);
  }

  getPendingLicenseRequests(): Observable<LicenseVerificationItem[]> {
    return this.http.get<LicenseVerificationItem[]>(`${this.apiUrl}/license-requests`);
  }

  verifyLicense(profileId: string, request: LicenseVerificationRequest): Observable<{ message: string }> {
    if (request.approved) {
      return this.http.put<{ message: string }>(`${this.apiUrl}/license/${profileId}/approve`, {});
    } else {
      return this.http.put<{ message: string }>(`${this.apiUrl}/license/${profileId}/reject`, {});
    }
  }

  getAllUsers(): Observable<AdminUserListItem[]> {
    return this.http.get<AdminUserListItem[]>(`${this.apiUrl}/users`);
  }

  // Pricing endpoints
  getPricingSettings(): Observable<PricingSettings> {
    return this.http.get<PricingSettings>(`${this.apiUrl}/pricing`);
  }

  updatePricingSettings(request: UpdatePricingSettingsRequest): Observable<PricingSettings> {
    return this.http.put<PricingSettings>(`${this.apiUrl}/pricing`, request);
  }
}
