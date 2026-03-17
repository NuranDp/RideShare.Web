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
import { AdminService } from '../../services/admin.service';
import { LicenseVerificationItem } from '../../models/rider.model';

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
  template: `
    <div class="page-header">
      <div class="header-content">
        <button mat-icon-button class="back-btn" routerLink="/admin">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <div class="header-text">
          <h1>License Verification</h1>
          <p>Review and approve rider licenses</p>
        </div>
      </div>
    </div>

    <div class="review-container">
      @if (loading()) {
        <div class="loading-container">
          <mat-spinner diameter="40"></mat-spinner>
          <p>Loading requests...</p>
        </div>
      } @else if (requests().length === 0) {
        <mat-card class="empty-card">
          <mat-card-content>
            <div class="empty-icon">
              <mat-icon>check_circle</mat-icon>
            </div>
            <h2>All Caught Up!</h2>
            <p>No pending license verification requests.</p>
            <button mat-raised-button class="back-dashboard-btn" routerLink="/admin">
              <mat-icon>dashboard</mat-icon>
              Back to Dashboard
            </button>
          </mat-card-content>
        </mat-card>
      } @else {
        <div class="requests-count">
          <mat-icon>pending_actions</mat-icon>
          {{ requests().length }} pending {{ requests().length === 1 ? 'request' : 'requests' }}
        </div>

        <div class="requests-grid">
          @for (request of requests(); track request.id) {
            <mat-card class="request-card">
              <mat-card-header>
                <div class="rider-avatar">
                  <mat-icon>person</mat-icon>
                </div>
                <mat-card-title>{{ request.riderName }}</mat-card-title>
                <mat-card-subtitle>{{ request.riderEmail }}</mat-card-subtitle>
              </mat-card-header>

              <mat-card-content>
                <div class="info-grid">
                  <div class="info-item">
                    <span class="label">License Number</span>
                    <span class="value">{{ request.licenseNumber }}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">Expiry Date</span>
                    <span class="value">{{ request.licenseExpiryDate | date:'mediumDate' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">Motorcycle</span>
                    <span class="value">{{ request.motorcycleModel || 'Not specified' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">License Plate</span>
                    <span class="value">{{ request.plateNumber || 'Not specified' }}</span>
                  </div>
                  <div class="info-item full-width">
                    <span class="label">Submitted</span>
                    <span class="value">{{ request.submittedAt | date:'medium' }}</span>
                  </div>
                </div>

                @if (request.licenseImageUrl) {
                  <div class="license-image">
                    <a [href]="request.licenseImageUrl" target="_blank" class="image-link">
                      <mat-icon>image</mat-icon>
                      View License Image
                    </a>
                  </div>
                }

                <!-- Rejection Reason Input -->
                @if (showRejectInput() === request.id) {
                  <mat-form-field appearance="outline" class="full-width reject-input">
                    <mat-label>Rejection Reason</mat-label>
                    <textarea 
                      matInput 
                      [(ngModel)]="rejectionReason" 
                      rows="2"
                      placeholder="Enter reason for rejection"></textarea>
                  </mat-form-field>
                }
              </mat-card-content>

              <mat-card-actions align="end">
                @if (processing() === request.id) {
                  <mat-spinner diameter="24"></mat-spinner>
                } @else if (showRejectInput() === request.id) {
                  <button mat-button (click)="cancelReject()">Cancel</button>
                  <button 
                    mat-raised-button 
                    color="warn" 
                    (click)="confirmReject(request.id)"
                    [disabled]="!rejectionReason.trim()">
                    Confirm Reject
                  </button>
                } @else {
                  <button 
                    mat-raised-button 
                    color="warn" 
                    (click)="startReject(request.id)">
                    <mat-icon>close</mat-icon>
                    Reject
                  </button>
                  <button 
                    mat-raised-button 
                    color="primary" 
                    (click)="approve(request.id)">
                    <mat-icon>check</mat-icon>
                    Approve
                  </button>
                }
              </mat-card-actions>
            </mat-card>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .page-header {
      background: linear-gradient(135deg, #034694 0%, #0A56A4 100%);
      color: white;
      padding: 20px 24px;
    }

    .header-content {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .back-btn {
      background: rgba(255,255,255,0.15);
    }

    .header-text h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }

    .header-text p {
      margin: 4px 0 0;
      opacity: 0.9;
      font-size: 14px;
    }

    .review-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 24px;
      background: #f8fafc;
      min-height: calc(100vh - 100px);
    }

    .requests-count {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 20px;
      padding: 12px 16px;
      background: #e3f2fd;
      border-radius: 8px;
      color: #034694;
      font-weight: 500;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 4rem;
      gap: 1rem;
    }

    .empty-card {
      text-align: center;
      padding: 48px;
      border-radius: 16px !important;
      max-width: 400px;
      margin: 40px auto;
    }

    .empty-icon {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, #4caf50, #2e7d32);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
    }

    .empty-icon mat-icon {
      font-size: 44px;
      width: 44px;
      height: 44px;
      color: white;
    }

    .empty-card h2 {
      margin: 0 0 8px;
      color: #1e293b;
    }

    .empty-card p {
      color: #64748b;
      margin: 0 0 24px;
    }

    .back-dashboard-btn {
      background: linear-gradient(135deg, #034694 0%, #0A56A4 100%) !important;
      color: white !important;
      border-radius: 8px !important;
    }

    .requests-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
      gap: 20px;
    }

    .request-card {
      border-radius: 16px !important;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06) !important;
      transition: all 0.3s;
    }

    .request-card:hover {
      box-shadow: 0 8px 24px rgba(3, 70, 148, 0.12) !important;
    }

    .rider-avatar {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, #034694 0%, #0A56A4 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 16px;
    }

    .rider-avatar mat-icon {
      color: white;
      font-size: 26px;
      width: 26px;
      height: 26px;
    }

    mat-card-header {
      padding: 20px 20px 0 !important;
    }

    mat-card-title {
      font-weight: 600 !important;
      color: #1e293b !important;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      margin: 16px 0;
      padding: 16px;
      background: #f8fafc;
      border-radius: 12px;

      .info-item {
        display: flex;
        flex-direction: column;

        &.full-width {
          grid-column: 1 / -1;
        }

        .label {
          font-size: 11px;
          color: #64748b;
          text-transform: uppercase;
          font-weight: 500;
        }

        .value {
          font-size: 14px;
          color: #1e293b;
          font-weight: 500;
          margin-top: 2px;
        }
      }
    }

    .license-image {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;

      .image-link {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        color: #034694;
        text-decoration: none;
        font-weight: 500;
        padding: 8px 16px;
        background: #e3f2fd;
        border-radius: 8px;
        transition: all 0.2s;

        &:hover {
          background: #bbdefb;
        }
      }
    }

    .reject-input {
      margin-top: 16px;
    }

    .full-width {
      width: 100%;
    }

    mat-card-actions {
      padding: 16px 20px !important;
      gap: 8px;
      
      mat-spinner {
        margin: 0 16px;
      }

      button {
        border-radius: 8px !important;
      }

      button[color="primary"] {
        background: linear-gradient(135deg, #2e7d32 0%, #4caf50 100%) !important;
      }
    }

    @media (max-width: 600px) {
      .page-header {
        padding: 16px;
      }

      .header-text h1 {
        font-size: 20px;
      }

      .review-container {
        padding: 16px;
      }

      .requests-grid {
        grid-template-columns: 1fr;
      }

      .info-grid {
        grid-template-columns: 1fr;
      }

      mat-card-actions {
        flex-direction: column;
        gap: 8px;
      }

      mat-card-actions button {
        width: 100%;
        margin: 0;
      }
    }
  `]
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
}
