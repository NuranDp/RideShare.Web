import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface CreateReportRequest {
  reportedUserId: string;
  rideId?: string;
  reason: string;
  description?: string;
}

export interface ResolveReportRequest {
  status: 'Resolved' | 'Dismissed';
  adminNotes?: string;
}

export interface ReportDto {
  id: string;
  reporterId: string;
  reporterName: string;
  reporterEmail: string;
  reportedUserId: string;
  reportedUserName: string;
  reportedUserEmail: string;
  reportedUserRole: string;
  rideId?: string;
  rideOrigin?: string;
  rideDestination?: string;
  reason: string;
  description?: string;
  status: string;
  adminNotes?: string;
  resolvedByAdminName?: string;
  resolvedAt?: string;
  createdAt: string;
}

export const REPORT_REASONS = [
  { value: 'SafetyConcern', label: 'Safety Concern' },
  { value: 'Harassment', label: 'Harassment' },
  { value: 'NoShow', label: 'No Show' },
  { value: 'RecklessDriving', label: 'Reckless Driving' },
  { value: 'FakeProfile', label: 'Fake Profile' },
  { value: 'InappropriateBehavior', label: 'Inappropriate Behavior' },
  { value: 'Other', label: 'Other' }
];

@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly apiUrl = `${environment.apiUrl}/reports`;

  constructor(private http: HttpClient) {}

  createReport(request: CreateReportRequest): Observable<ReportDto> {
    return this.http.post<ReportDto>(this.apiUrl, request);
  }

  getMyReports(): Observable<ReportDto[]> {
    return this.http.get<ReportDto[]>(`${this.apiUrl}/my-reports`);
  }

  getAllReports(status?: string): Observable<ReportDto[]> {
    const params = status ? `?status=${status}` : '';
    return this.http.get<ReportDto[]>(`${this.apiUrl}${params}`);
  }

  getReport(id: string): Observable<ReportDto> {
    return this.http.get<ReportDto>(`${this.apiUrl}/${id}`);
  }

  resolveReport(id: string, request: ResolveReportRequest): Observable<ReportDto> {
    return this.http.put<ReportDto>(`${this.apiUrl}/${id}/resolve`, request);
  }
}
