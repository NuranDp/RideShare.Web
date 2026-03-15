import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { RideService } from '../../services/ride.service';
import { PassengerRideHistory, CreateRatingRequest } from '../../models/ride.model';
import { RatingDialogComponent, RatingDialogData } from '../../components/rating-dialog/rating-dialog.component';

@Component({
  selector: 'app-ride-history',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule
  ],
  template: `
    <div class="history-container">
      <div class="page-header">
        <div>
          <h1>Ride History</h1>
          <p class="subtitle">Your past rides</p>
        </div>
        <button mat-raised-button color="primary" routerLink="/passenger/browse-rides">
          <mat-icon>search</mat-icon>
          Find a Ride
        </button>
      </div>

      @if (loading) {
        <div class="loading-container">
          <mat-spinner diameter="40"></mat-spinner>
          <p>Loading your ride history...</p>
        </div>
      }

      @if (!loading && history.length === 0) {
        <mat-card class="empty-state">
          <mat-icon>history</mat-icon>
          <h3>No ride history yet</h3>
          <p>Once you complete rides, they'll appear here.</p>
          <button mat-raised-button color="primary" routerLink="/passenger/browse-rides">
            Find Your First Ride
          </button>
        </mat-card>
      }

      @if (!loading && history.length > 0) {
        <div class="stats-summary">
          <div class="stat-card">
            <mat-icon>check_circle</mat-icon>
            <div class="stat-value">{{ completedCount }}</div>
            <div class="stat-label">Completed</div>
          </div>
          <div class="stat-card">
            <mat-icon>cancel</mat-icon>
            <div class="stat-value">{{ cancelledCount }}</div>
            <div class="stat-label">Cancelled</div>
          </div>
          <div class="stat-card">
            <mat-icon>star</mat-icon>
            <div class="stat-value">{{ ratedCount }}</div>
            <div class="stat-label">Rated</div>
          </div>
        </div>

        <div class="history-list">
          @for (ride of history; track ride.rideId) {
            <mat-card class="history-card" [class.cancelled]="ride.rideStatus === 'Cancelled'">
              <mat-card-header>
                <mat-icon mat-card-avatar [class]="'status-icon status-' + ride.rideStatus.toLowerCase()">
                  {{ ride.rideStatus === 'Completed' ? 'check_circle' : 'cancel' }}
                </mat-icon>
                <mat-card-title>{{ ride.origin }} → {{ ride.destination }}</mat-card-title>
                <mat-card-subtitle>
                  <mat-icon class="small-icon">person</mat-icon>
                  {{ ride.riderName }}
                  @if (ride.riderRating > 0) {
                    <span class="rating-badge">
                      <mat-icon class="star-icon">star</mat-icon>
                      {{ ride.riderRating | number:'1.1-1' }}
                    </span>
                  }
                </mat-card-subtitle>
              </mat-card-header>

              <mat-card-content>
                <div class="ride-details">
                  <div class="detail-item">
                    <mat-icon>schedule</mat-icon>
                    <span>{{ formatDateTime(ride.departureTime) }}</span>
                  </div>
                  <div class="detail-item">
                    <mat-icon>sports_motorsports</mat-icon>
                    <span>{{ ride.helmetProvided ? 'Helmet provided' : 'No helmet' }}</span>
                  </div>
                  <div class="detail-item">
                    <mat-icon>event</mat-icon>
                    <span>{{ ride.rideStatus === 'Completed' ? 'Completed' : 'Cancelled' }}: {{ formatDate(ride.completedAt) }}</span>
                  </div>
                </div>

                <mat-chip [class]="'chip-' + ride.rideStatus.toLowerCase()">
                  {{ ride.rideStatus }}
                </mat-chip>

                @if (ride.hasRated) {
                  <div class="my-rating">
                    <span>Your rating:</span>
                    @for (star of [1, 2, 3, 4, 5]; track star) {
                      <mat-icon class="rating-star" [class.filled]="star <= (ride.myRating || 0)">
                        {{ star <= (ride.myRating || 0) ? 'star' : 'star_border' }}
                      </mat-icon>
                    }
                  </div>
                }
              </mat-card-content>

              @if (ride.rideStatus === 'Completed' && !ride.hasRated) {
                <mat-card-actions align="end">
                  <button mat-raised-button color="accent" (click)="rateRide(ride)">
                    <mat-icon>star</mat-icon>
                    Rate This Ride
                  </button>
                </mat-card-actions>
              }
            </mat-card>
          }
        </div>
      }

      <div class="back-link">
        <button mat-button routerLink="/passenger">
          <mat-icon>arrow_back</mat-icon>
          Back to Dashboard
        </button>
      </div>
    </div>

    <!-- Bottom Navigation -->
    <nav class="bottom-nav">
      <a class="nav-item" routerLink="/passenger">
        <mat-icon>home</mat-icon>
        <span>Home</span>
      </a>
      <a class="nav-item" routerLink="/passenger/browse-rides">
        <mat-icon>search</mat-icon>
        <span>Find Ride</span>
      </a>
      <a class="nav-item" routerLink="/passenger/my-requests">
        <mat-icon>pending_actions</mat-icon>
        <span>Requests</span>
      </a>
      <a class="nav-item" (click)="goToProfile()">
        <mat-icon>person</mat-icon>
        <span>Profile</span>
      </a>
    </nav>
  `,
  styles: [`
    .history-container {
      padding: 24px;
      max-width: 1000px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
    }

    .page-header h1 {
      margin: 0;
      color: #1976d2;
    }

    .subtitle {
      color: #666;
      margin: 4px 0 0;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 48px;
      color: #666;
    }

    .empty-state {
      text-align: center;
      padding: 48px;
    }

    .empty-state mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #ccc;
    }

    .empty-state h3 {
      margin: 16px 0 8px;
    }

    .empty-state p {
      color: #666;
      margin-bottom: 24px;
    }

    .stats-summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .stat-card {
      background: white;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .stat-card mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: #1976d2;
    }

    .stat-value {
      font-size: 32px;
      font-weight: bold;
      color: #333;
    }

    .stat-label {
      color: #666;
      font-size: 14px;
    }

    .history-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .history-card {
      transition: transform 0.2s;
    }

    .history-card:hover {
      transform: translateY(-2px);
    }

    .history-card.cancelled {
      opacity: 0.8;
    }

    .status-icon {
      padding: 8px;
      border-radius: 50%;
    }

    .status-completed {
      background: #e8f5e9;
      color: #2e7d32;
    }

    .status-cancelled {
      background: #ffebee;
      color: #c62828;
    }

    .ride-details {
      display: flex;
      flex-wrap: wrap;
      gap: 24px;
      margin: 16px 0;
    }

    .detail-item {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #666;
    }

    .detail-item mat-icon {
      color: #1976d2;
      font-size: 20px;
      width: 20px;
      height: 20px;
      line-height: 1;
    }

    .small-icon {
      font-size: 16px !important;
      width: 16px !important;
      height: 16px !important;
      vertical-align: middle;
      line-height: 1;
    }

    .rating-badge {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      background: #fff8e1;
      color: #f57c00;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
      margin-left: 8px;
    }

    .rating-badge .star-icon {
      font-size: 14px !important;
      width: 14px !important;
      height: 14px !important;
      color: #ffc107;
    }

    .chip-completed {
      background: #e8f5e9 !important;
      color: #2e7d32 !important;
    }

    .chip-cancelled {
      background: #ffebee !important;
      color: #c62828 !important;
    }

    .my-rating {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-top: 12px;
      color: #666;
    }

    .my-rating span {
      margin-right: 8px;
    }

    .rating-star {
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: #ccc;
    }

    .rating-star.filled {
      color: #ffc107;
    }

    .back-link {
      margin-top: 24px;
    }

    @media (max-width: 480px) {
      .history-container {
        padding: 12px;
        overflow-x: hidden;
        max-width: 100vw;
      }

      .page-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
        max-width: 100%;
      }

      .page-header h1 {
        font-size: 20px;
        word-break: break-word;
      }

      .stats-row {
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }

      .stat-card {
        padding: 12px;
        max-width: 100%;
        overflow: hidden;
      }

      .ride-details {
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }

      mat-card {
        max-width: 100%;
        overflow: hidden;
      }
    }

    /* Bottom Navigation */
    .bottom-nav {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      display: flex;
      justify-content: space-around;
      background: white;
      border-top: 1px solid #eee;
      padding: 8px 0;
      padding-bottom: max(8px, env(safe-area-inset-bottom));
      z-index: 100;
    }

    .nav-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      padding: 6px 16px;
      color: #999;
      text-decoration: none;
      font-size: 11px;
      cursor: pointer;
      transition: color 0.2s;
    }

    .nav-item mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .nav-item.active {
      color: #667eea;
    }
  `]
})
export class RideHistoryComponent implements OnInit {
  history: PassengerRideHistory[] = [];
  loading = true;

  constructor(
    private rideService: RideService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadHistory();
  }

  loadHistory(): void {
    this.loading = true;
    this.rideService.getMyRideHistory().subscribe({
      next: (history) => {
        this.history = history;
        this.loading = false;
      },
      error: () => {
        this.snackBar.open('Failed to load ride history', 'Close', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  get completedCount(): number {
    return this.history.filter(h => h.rideStatus === 'Completed').length;
  }

  get cancelledCount(): number {
    return this.history.filter(h => h.rideStatus === 'Cancelled').length;
  }

  get ratedCount(): number {
    return this.history.filter(h => h.hasRated).length;
  }

  formatDateTime(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  rateRide(ride: PassengerRideHistory): void {
    const dialogRef = this.dialog.open(RatingDialogComponent, {
      width: '400px',
      maxWidth: '95vw',
      data: {
        rideId: ride.rideId,
        riderName: ride.riderName,
        origin: ride.origin,
        destination: ride.destination
      } as RatingDialogData
    });

    dialogRef.afterClosed().subscribe((result: CreateRatingRequest | undefined) => {
      if (result) {
        this.rideService.rateRider(ride.rideId, result).subscribe({
          next: () => {
            this.snackBar.open('Thank you for your rating!', 'Close', { duration: 3000 });
            this.loadHistory();
          },
          error: () => {
            this.snackBar.open('Failed to submit rating', 'Close', { duration: 3000 });
          }
        });
      }
    });
  }

  goToProfile(): void {
    this.router.navigate(['/passenger'], { queryParams: { tab: 'profile' } });
  }
}
