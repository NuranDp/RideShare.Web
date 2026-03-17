import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatRippleModule } from '@angular/material/core';
import { RideService } from '../../../services/ride.service';
import { MyRideRequest, RequestStatus, CreateRatingRequest } from '../../../models/ride.model';
import { RatingDialogComponent, RatingDialogData } from '../../../components/rating-dialog/rating-dialog.component';
import { NotificationBellComponent } from '../../../components/notification-bell/notification-bell.component';

@Component({
  selector: 'app-my-requests',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    MatRippleModule,
    NotificationBellComponent
  ],
  templateUrl: './my-requests.component.html',
  styleUrls: ['./my-requests.component.scss']
})
export class MyRequestsComponent implements OnInit {
  requests: MyRideRequest[] = [];
  loading = true;
  activeTab: 'pending' | 'accepted' | 'history' = 'pending';

  constructor(
    private rideService: RideService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadRequests();
  }

  loadRequests(): void {
    this.loading = true;
    this.rideService.getMyRequests().subscribe({
      next: (requests) => {
        this.requests = requests;
        this.loading = false;
      },
      error: () => {
        this.snackBar.open('Failed to load requests', 'Close', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  get pendingRequests(): MyRideRequest[] {
    return this.requests.filter(r => r.status === 'Pending');
  }

  get acceptedRequests(): MyRideRequest[] {
    return this.requests.filter(r => r.status === 'Accepted');
  }

  get historyRequests(): MyRideRequest[] {
    return this.requests.filter(r => r.status === 'Rejected' || r.status === 'Cancelled');
  }

  getStatusIcon(status: RequestStatus): string {
    switch (status) {
      case 'Pending': return 'hourglass_top';
      case 'Accepted': return 'check_circle';
      case 'Rejected': return 'cancel';
      case 'Cancelled': return 'block';
      default: return 'help';
    }
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

  cancelRequest(request: MyRideRequest): void {
    if (confirm('Are you sure you want to cancel this request?')) {
      this.rideService.cancelMyRequest(request.id).subscribe({
        next: () => {
          this.snackBar.open('Request cancelled', 'Close', { duration: 3000 });
          this.loadRequests();
        },
        error: () => {
          this.snackBar.open('Failed to cancel request', 'Close', { duration: 3000 });
        }
      });
    }
  }

  rateRide(request: MyRideRequest): void {
    const dialogRef = this.dialog.open(RatingDialogComponent, {
      width: '400px',
      maxWidth: '95vw',
      data: {
        rideId: request.rideId,
        riderName: request.riderName,
        origin: request.origin,
        destination: request.destination
      } as RatingDialogData
    });

    dialogRef.afterClosed().subscribe((result: CreateRatingRequest | undefined) => {
      if (result) {
        this.rideService.rateRider(request.rideId, result).subscribe({
          next: () => {
            this.snackBar.open('Thank you for your rating!', 'Close', { duration: 3000 });
            this.loadRequests();
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
}
