import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../../services/admin.service';
import { LicenseVerificationItem } from '../../../models/rider.model';

@Component({
  selector: 'app-license-review',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatChipsModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    MatTableModule,
    RouterLink
  ],
  templateUrl: './license-review.component.html',
  styleUrls: ['./license-review.component.scss']
})
export class LicenseReviewComponent implements OnInit {
  requests = signal<LicenseVerificationItem[]>([]);
  loading = signal(true);
  processing = signal<string | null>(null);
  showRejectInput = signal<string | null>(null);
  rejectionReason = '';

  constructor(
    private adminService: AdminService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadRequests();
  }

  loadRequests(): void {
    this.loading.set(true);
    this.adminService.getPendingLicenseRequests().subscribe({
      next: (requests) => {
        this.requests.set(requests);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading requests:', err);
        this.snackBar.open('Failed to load license requests', 'Close', { duration: 3000 });
        this.loading.set(false);
      }
    });
  }

  approve(profileId: string): void {
    this.processing.set(profileId);
    this.adminService.verifyLicense(profileId, { approved: true }).subscribe({
      next: (response) => {
        this.requests.update(requests => requests.filter(r => r.id !== profileId));
        this.snackBar.open(response.message, 'Close', { duration: 3000 });
        this.processing.set(null);
      },
      error: (err) => {
        console.error('Error approving license:', err);
        this.snackBar.open('Failed to approve license', 'Close', { duration: 3000 });
        this.processing.set(null);
      }
    });
  }

  startReject(profileId: string): void {
    this.showRejectInput.set(profileId);
    this.rejectionReason = '';
  }

  cancelReject(): void {
    this.showRejectInput.set(null);
    this.rejectionReason = '';
  }

  confirmReject(profileId: string): void {
    if (!this.rejectionReason.trim()) return;

    this.processing.set(profileId);
    this.showRejectInput.set(null);
    
    this.adminService.verifyLicense(profileId, { 
      approved: false, 
      rejectionReason: this.rejectionReason 
    }).subscribe({
      next: (response) => {
        this.requests.update(requests => requests.filter(r => r.id !== profileId));
        this.snackBar.open(response.message, 'Close', { duration: 3000 });
        this.processing.set(null);
        this.rejectionReason = '';
      },
      error: (err) => {
        console.error('Error rejecting license:', err);
        this.snackBar.open('Failed to reject license', 'Close', { duration: 3000 });
        this.processing.set(null);
      }
    });
  }

  isExpiringSoon(dateStr: string | undefined): boolean {
    if (!dateStr) return false;
    const expiryDate = new Date(dateStr);
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
    return expiryDate <= threeMonthsFromNow;
  }
}
