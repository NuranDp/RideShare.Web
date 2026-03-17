import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatRippleModule } from '@angular/material/core';
import { RideService } from '../../../services/ride.service';
import { Ride, RideStatus } from '../../../models/ride.model';
import { NotificationBellComponent } from '../../../components/notification-bell/notification-bell.component';

@Component({
  selector: 'app-my-rides',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatRippleModule,
    NotificationBellComponent
  ],
  templateUrl: './my-rides.component.html',
  styleUrls: ['./my-rides.component.scss']
})
export class MyRidesComponent implements OnInit, OnDestroy {
  rides: Ride[] = [];
  loading = true;
  startingRide = false;
  expandedRides = new Set<string>();
  activeTab: 'active' | 'history' = 'active';
  private locationWatchId: number | null = null;
  private currentRideId: string | null = null;

  get activeRides(): Ride[] {
    return this.rides.filter(r => r.status === 'Active' || r.status === 'Booked' || r.status === 'InProgress');
  }

  get historyRides(): Ride[] {
    return this.rides.filter(r => r.status === 'Completed' || r.status === 'Cancelled');
  }

  constructor(
    private rideService: RideService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadRides();
  }

  loadRides(): void {
    this.loading = true;
    this.rideService.getMyPostedRides().subscribe({
      next: (rides) => {
        this.rides = rides;
        this.loading = false;
      },
      error: () => {
        this.snackBar.open('Failed to load rides', 'Close', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  getStatusIcon(status: RideStatus): string {
    switch (status) {
      case 'Active': return 'radio_button_unchecked';
      case 'Booked': return 'person';
      case 'InProgress': return 'two_wheeler';
      case 'Completed': return 'check_circle';
      case 'Cancelled': return 'cancel';
      default: return 'help';
    }
  }

  formatDateTime(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getShortAddress(fullAddress: string): string {
    if (!fullAddress) return 'Not specified';
    const parts = fullAddress.split(/[,،]/);
    let shortAddr = parts[0].trim();
    return shortAddr.length > 20 ? shortAddr.substring(0, 20) + '...' : shortAddr;
  }

  toggleExpand(rideId: string): void {
    if (this.expandedRides.has(rideId)) {
      this.expandedRides.delete(rideId);
    } else {
      this.expandedRides.add(rideId);
    }
  }

  viewRequests(ride: Ride): void {
    this.router.navigate(['/rider/ride-requests', ride.id]);
  }

  cancelRide(ride: Ride): void {
    if (confirm(`Are you sure you want to cancel this ride?`)) {
      this.rideService.cancelRide(ride.id).subscribe({
        next: () => {
          this.snackBar.open('Ride cancelled', 'Close', { duration: 3000 });
          this.loadRides();
        },
        error: () => {
          this.snackBar.open('Failed to cancel ride', 'Close', { duration: 3000 });
        }
      });
    }
  }

  completeRide(ride: Ride): void {
    if (confirm(`Mark this ride as completed?`)) {
      this.stopLocationSharing();
      
      this.rideService.completeRide(ride.id).subscribe({
        next: () => {
          this.snackBar.open('Ride completed!', 'Close', { duration: 3000 });
          this.loadRides();
        },
        error: () => {
          this.snackBar.open('Failed to complete ride', 'Close', { duration: 3000 });
        }
      });
    }
  }

  startRide(ride: Ride): void {
    this.startingRide = true;
    
    if (!navigator.geolocation) {
      this.snackBar.open('Geolocation is not supported by your browser', 'Close', { duration: 3000 });
      this.startingRide = false;
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const request = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };

        this.rideService.startRide(ride.id, request).subscribe({
          next: () => {
            this.snackBar.open('Ride started! Passenger has been notified.', 'Close', { duration: 3000 });
            this.currentRideId = ride.id;
            this.startLocationSharing();
            this.loadRides();
            this.startingRide = false;
          },
          error: (err) => {
            this.snackBar.open(err.error?.message || 'Failed to start ride', 'Close', { duration: 3000 });
            this.startingRide = false;
          }
        });
      },
      (error) => {
        let message = 'Failed to get your location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Please allow location access to start the ride';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Location information is unavailable';
            break;
          case error.TIMEOUT:
            message = 'Location request timed out';
            break;
        }
        this.snackBar.open(message, 'Close', { duration: 3000 });
        this.startingRide = false;
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  private startLocationSharing(): void {
    if (!navigator.geolocation || !this.currentRideId) return;

    this.locationWatchId = navigator.geolocation.watchPosition(
      (position) => {
        this.rideService.updateLocation(this.currentRideId!, {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }).subscribe();
      },
      (error) => {
        console.error('Location watch error:', error);
      },
      { enableHighAccuracy: true, maximumAge: 5000 }
    );
  }

  private stopLocationSharing(): void {
    if (this.locationWatchId !== null) {
      navigator.geolocation.clearWatch(this.locationWatchId);
      this.locationWatchId = null;
    }
    this.currentRideId = null;
  }

  goToRequests(): void {
    this.router.navigate(['/rider'], { queryParams: { tab: 'requests' } });
  }

  goToProfile(): void {
    this.router.navigate(['/rider'], { queryParams: { tab: 'profile' } });
  }

  ngOnDestroy(): void {
    this.stopLocationSharing();
  }
}
