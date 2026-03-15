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
    <div class="review-container">
      <div class="header">
        <h1>License Verification Requests</h1>
        <button mat-button routerLink="/admin">
          <mat-icon>arrow_back</mat-icon>
          Back to Dashboard
        </button>
      </div>

      @if (loading()) {
        <div class="loading-container">
          <mat-spinner diameter="40"></mat-spinner>
          <p>Loading requests...</p>
        </div>
      } @else if (requests().length === 0) {
        <mat-card class="empty-card">
          <mat-card-content>
            <mat-icon>check_circle</mat-icon>
            <h2>All Caught Up!</h2>
            <p>No pending license verification requests.</p>
          </mat-card-content>
        </mat-card>
      } @else {
        <div class="requests-grid">
          @for (request of requests(); track request.id) {
            <mat-card class="request-card">
              <mat-card-header>
                <mat-icon mat-card-avatar class="avatar-icon">person</mat-icon>
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
                  <div class="info-item">
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
    .review-container {
      max-width: 1200px;
      margin: 2rem auto;
      padding: 0 1rem;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;

      h1 {
        margin: 0;
        color: #333;
      }
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
      padding: 3rem;

      mat-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        color: #4caf50;
        margin-bottom: 1rem;
      }

      h2 {
        margin: 0 0 0.5rem;
        color: #333;
      }

      p {
        color: #666;
        margin: 0;
      }
    }

    .requests-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
      gap: 1.5rem;
    }

    .request-card {
      .avatar-icon {
        background: #1976d2;
        color: white;
        border-radius: 50%;
        padding: 8px;
        font-size: 24px;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
      margin: 1rem 0;

      .info-item {
        display: flex;
        flex-direction: column;

        .label {
          font-size: 0.75rem;
          color: #666;
          text-transform: uppercase;
        }

        .value {
          font-size: 0.95rem;
          color: #333;
          font-weight: 500;
        }
      }
    }

    .license-image {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #eee;

      .image-link {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        color: #1976d2;
        text-decoration: none;

        &:hover {
          text-decoration: underline;
        }
      }
    }

    .reject-input {
      margin-top: 1rem;
    }

    .full-width {
      width: 100%;
    }

    mat-card-actions {
      padding: 1rem;
      
      mat-spinner {
        margin: 0 1rem;
      }

      button {
        margin-left: 0.5rem;
      }
    }

    @media (max-width: 600px) {
      .review-container {
        padding: 1rem;
      }

      h1 {
        font-size: 22px;
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
