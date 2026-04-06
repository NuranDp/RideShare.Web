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
import { RideService } from '../../../services/ride.service';
import { PassengerRideHistory, CreateRatingRequest } from '../../../models/ride.model';
import { RatingDialogComponent, RatingDialogData } from '../../../components/rating-dialog/rating-dialog.component';
import { ReportDialogComponent, ReportDialogData } from '../../../components/report-dialog/report-dialog.component';

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
  templateUrl: './ride-history.component.html',
  styleUrls: ['./ride-history.component.scss']
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

  formatDate(dateStr: string | undefined): string {
    if (!dateStr) return 'N/A';
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
            this.snackBar.open('Failed to submit rating. Please try again.', 'Close', { duration: 3000 });
          }
        });
      }
    });
  }

  goToProfile(): void {
    this.router.navigate(['/passenger'], { queryParams: { tab: 'profile' } });
  }

  reportUser(ride: PassengerRideHistory): void {
    this.dialog.open(ReportDialogComponent, {
      width: '440px',
      maxWidth: '95vw',
      data: {
        reportedUserId: ride.riderId,
        reportedUserName: ride.riderName,
        rideId: ride.rideId
      } as ReportDialogData
    });
  }
}
