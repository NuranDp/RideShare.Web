import { Component, OnInit, OnDestroy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRippleModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { OnDemandService } from '../../../services/on-demand.service';
import { NotificationService } from '../../../services/notification.service';
import { NearbyRequest, OnDemandRequest } from '../../../models/on-demand.model';
import { NearbyRequestDialogComponent } from './nearby-request-dialog.component';

@Component({
  selector: 'app-nearby-requests',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatRippleModule,
    MatSnackBarModule,
    MatSlideToggleModule,
    MatDialogModule,
    NearbyRequestDialogComponent
  ],
  templateUrl: './nearby-requests.component.html',
  styleUrls: ['./nearby-requests.component.scss']
})
export class NearbyRequestsComponent implements OnInit, OnDestroy {
  // Tab State
  activeTab: 'active' | 'history' = 'active';

  // Data
  requests: NearbyRequest[] = [];
  acceptedRequests: OnDemandRequest[] = [];
  
  // State
  loading = true;
  historyLoading = false;
  isAvailable = false;
  acceptingId: string | null = null;
  isRiderVerified = true;
  
  // Location
  currentLat = 0;
  currentLng = 0;
  locationWatchId: number | null = null;
  
  // Refresh interval
  private refreshInterval: any;

  constructor(
    private onDemandService: OnDemandService,
    private notificationService: NotificationService,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    // Restore availability state
    const storedAvailable = localStorage.getItem('riderAvailable') === 'true';
    if (storedAvailable) {
      this.isAvailable = true;
      this.onDemandService.setAvailable(true);
    }
    
    this.getCurrentLocation();
    
    // Listen for new on-demand requests using effect
    effect(() => {
      const notifications = this.notificationService.notifications();
      const newRequest = notifications.find((n: any) => n.type === 'ondemand_request' && !n.read);
      if (newRequest && this.isAvailable) {
        this.refreshRequests();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.locationWatchId !== null) {
      navigator.geolocation.clearWatch(this.locationWatchId);
    }
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  private getCurrentLocation(): void {
    if (!navigator.geolocation) {
      this.loading = false;
      this.snackBar.open('Geolocation is not supported', 'OK', { duration: 3000 });
      return;
    }

    // Get initial position
    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.currentLat = position.coords.latitude;
        this.currentLng = position.coords.longitude;
        localStorage.setItem('riderCurrentLat', this.currentLat.toString());
        localStorage.setItem('riderCurrentLng', this.currentLng.toString());
        if (this.isAvailable) {
          this.refreshRequests();
        } else {
          this.loading = false;
        }
      },
      (error) => {
        this.loading = false;
        this.snackBar.open('Could not get your location. Please enable GPS.', 'OK', { duration: 3000 });
      },
      { enableHighAccuracy: true }
    );

    // Watch for position changes
    this.locationWatchId = navigator.geolocation.watchPosition(
      (position) => {
        this.currentLat = position.coords.latitude;
        this.currentLng = position.coords.longitude;
        localStorage.setItem('riderCurrentLat', this.currentLat.toString());
        localStorage.setItem('riderCurrentLng', this.currentLng.toString());
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 10000 }
    );
  }

  toggleAvailability(): void {
    this.isAvailable = !this.isAvailable;
    this.onDemandService.setAvailable(this.isAvailable);
    
    if (this.isAvailable) {
      this.refreshRequests();
      // Start auto-refresh every 30 seconds
      this.refreshInterval = setInterval(() => {
        if (this.isAvailable) {
          this.refreshRequests();
        }
      }, 30000);
      this.snackBar.open('You are now available for ride requests', 'OK', { duration: 2000 });
    } else {
      if (this.refreshInterval) {
        clearInterval(this.refreshInterval);
      }
      this.requests = [];
      this.snackBar.open('You are now offline', 'OK', { duration: 2000 });
    }
  }

  refreshRequests(): void {
    if (!this.currentLat || !this.currentLng) return;
    
    this.loading = true;
    this.onDemandService.getNearbyRequests(this.currentLat, this.currentLng, 10).subscribe({
      next: (response) => {
        this.isRiderVerified = response.isRiderVerified;
        this.requests = response.requests;
        this.loading = false;
        
        if (!response.isRiderVerified) {
          this.snackBar.open('Your license is not verified yet. Please complete verification to accept requests.', 'OK', { duration: 5000 });
        }
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Failed to load nearby requests', 'OK', { duration: 2000 });
      }
    });
  }

  switchToHistory(): void {
    this.activeTab = 'history';
    if (this.acceptedRequests.length === 0) {
      this.loadHistory();
    }
  }

  loadHistory(): void {
    this.historyLoading = true;
    this.onDemandService.getMyAcceptedRequests().subscribe({
      next: (requests) => {
        this.acceptedRequests = requests;
        this.historyLoading = false;
      },
      error: () => {
        this.historyLoading = false;
        this.snackBar.open('Failed to load history', 'OK', { duration: 2000 });
      }
    });
  }

  openRequestDialog(request: NearbyRequest): void {
    const dialogRef = this.dialog.open(NearbyRequestDialogComponent, {
      data: { request },
      panelClass: ['nearby-request-dialog'],
      width: '100%',
      maxWidth: '100vw',
      position: { bottom: '0' },
      disableClose: false,
      hasBackdrop: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.accepted) {
        this.acceptRequest(request);
      }
    });
  }

  acceptRequest(request: NearbyRequest): void {
    this.acceptingId = request.id;
    
    this.onDemandService.acceptRequest(request.id).subscribe({
      next: (result) => {
        this.acceptingId = null;
        this.snackBar.open('Request accepted! Starting ride...', 'OK', { duration: 2000 });
        
        // Navigate to active ride page (Uber-like behavior)
        if (result.rideId) {
          this.router.navigate(['/rider/active-ride', result.rideId]);
        } else {
          this.router.navigate(['/rider/my-rides']);
        }
      },
      error: (err) => {
        this.acceptingId = null;
        this.snackBar.open(err.error?.message || 'Failed to accept request', 'OK', { duration: 3000 });
        this.refreshRequests();
      }
    });
  }

  getTimeRemaining(expiresAt: string): string {
    let expiresAtStr = expiresAt;
    if (!expiresAtStr.endsWith('Z') && !expiresAtStr.includes('+')) {
      expiresAtStr += 'Z';
    }
    const now = Date.now();
    const expires = new Date(expiresAtStr).getTime();
    const remaining = Math.max(0, Math.floor((expires - now) / 1000));
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  getShortAddress(address: string): string {
    if (!address) return 'Unknown';
    const parts = address.split(',');
    return parts[0].trim();
  }

  formatDateTime(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'Accepted': return 'check_circle';
      case 'Completed': return 'done_all';
      case 'Cancelled': return 'cancel';
      case 'Expired': return 'schedule';
      default: return 'help';
    }
  }
}
