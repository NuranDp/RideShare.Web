import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AuthService } from '../../../services/auth.service';
import { ReportService, ReportDto, ResolveReportRequest } from '../../../services/report.service';

@Component({
  selector: 'app-manage-reports',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule
  ],
  templateUrl: './manage-reports.component.html',
  styleUrls: ['./manage-reports.component.scss']
})
export class ManageReportsComponent implements OnInit {
  reports: ReportDto[] = [];
  filteredReports: ReportDto[] = [];
  loading = true;
  statusFilter = '';
  processingId: string | null = null;

  // For resolve form
  resolveReportId: string | null = null;
  resolveStatus: 'Resolved' | 'Dismissed' = 'Resolved';
  adminNotes = '';

  constructor(
    public authService: AuthService,
    private reportService: ReportService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadReports();
  }

  loadReports(): void {
    this.loading = true;
    this.reportService.getAllReports(this.statusFilter || undefined).subscribe({
      next: (reports) => {
        this.reports = reports;
        this.filteredReports = reports;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Failed to load reports', 'Close', { duration: 3000 });
      }
    });
  }

  onFilterChange(): void {
    this.loadReports();
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Pending': return 'status-pending';
      case 'Reviewing': return 'status-reviewing';
      case 'Resolved': return 'status-resolved';
      case 'Dismissed': return 'status-dismissed';
      default: return '';
    }
  }

  getReasonLabel(reason: string): string {
    const labels: Record<string, string> = {
      'SafetyConcern': 'Safety Concern',
      'Harassment': 'Harassment',
      'NoShow': 'No Show',
      'RecklessDriving': 'Reckless Driving',
      'FakeProfile': 'Fake Profile',
      'InappropriateBehavior': 'Inappropriate Behavior',
      'Other': 'Other'
    };
    return labels[reason] || reason;
  }

  getReasonIcon(reason: string): string {
    const icons: Record<string, string> = {
      'SafetyConcern': 'health_and_safety',
      'Harassment': 'report',
      'NoShow': 'event_busy',
      'RecklessDriving': 'speed',
      'FakeProfile': 'person_off',
      'InappropriateBehavior': 'warning',
      'Other': 'flag'
    };
    return icons[reason] || 'flag';
  }

  startResolve(reportId: string): void {
    this.resolveReportId = reportId;
    this.resolveStatus = 'Resolved';
    this.adminNotes = '';
  }

  cancelResolve(): void {
    this.resolveReportId = null;
  }

  submitResolve(): void {
    if (!this.resolveReportId) return;

    this.processingId = this.resolveReportId;
    const request: ResolveReportRequest = {
      status: this.resolveStatus,
      adminNotes: this.adminNotes.trim() || undefined
    };

    this.reportService.resolveReport(this.resolveReportId, request).subscribe({
      next: (updated) => {
        const index = this.reports.findIndex(r => r.id === updated.id);
        if (index !== -1) this.reports[index] = updated;
        this.filteredReports = [...this.reports];
        this.resolveReportId = null;
        this.processingId = null;
        this.snackBar.open(`Report ${this.resolveStatus.toLowerCase()} successfully`, 'Close', { duration: 3000 });
      },
      error: (err) => {
        this.processingId = null;
        const msg = err.error?.message || 'Failed to resolve report';
        this.snackBar.open(msg, 'Close', { duration: 4000 });
      }
    });
  }

  get pendingCount(): number {
    return this.reports.filter(r => r.status === 'Pending').length;
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }
}
