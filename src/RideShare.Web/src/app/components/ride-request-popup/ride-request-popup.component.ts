import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { Router } from '@angular/router';
import { NotificationService, Notification } from '../../services/notification.service';
import { RideService } from '../../services/ride.service';
import { AuthService } from '../../services/auth.service';
import { PendingRequestWithRide } from '../../models/ride.model';

@Component({
  selector: 'app-ride-request-popup',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatRippleModule
  ],
  templateUrl: './ride-request-popup.component.html',
  styleUrls: ['./ride-request-popup.component.scss']
})
export class RideRequestPopupComponent implements OnInit, OnDestroy {
  private notificationService = inject(NotificationService);
  private rideService = inject(RideService);
  private authService = inject(AuthService);
  private router = inject(Router);

  pendingPopups: PendingRequestWithRide[] = [];
  currentIndex = 0;
  processingRequest: string | null = null;
  processingAction: 'accept' | 'reject' | null = null;

  private lastNotificationId: string | null = null;
  private checkInterval: any;

  get currentRequest(): PendingRequestWithRide {
    return this.pendingPopups[this.currentIndex];
  }

  ngOnInit(): void {
    // Only show for riders
    if (this.authService.currentUser()?.role !== 'Rider') {
      return;
    }

    // Check for new ride_request notifications
    this.checkInterval = setInterval(() => {
      this.checkForNewRequests();
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
  }

  private checkForNewRequests(): void {
    const notifications = this.notificationService.notifications();
    const rideRequests = notifications.filter(n => n.type === 'ride_request' && !n.read);
    
    if (rideRequests.length > 0) {
      const latestRequest = rideRequests[0];
      
      // Check if this is a new notification we haven't processed
      if (latestRequest.id !== this.lastNotificationId) {
        this.lastNotificationId = latestRequest.id;
        this.loadLatestPendingRequest();
      }
    }
  }

  private loadLatestPendingRequest(): void {
    this.rideService.getMyPendingRequests().subscribe({
      next: (requests) => {
        if (requests.length > 0) {
          // Add the newest request to popups if not already shown
          const newest = requests[0];
          if (!this.pendingPopups.find(p => p.id === newest.id)) {
            this.pendingPopups.unshift(newest);
          }
        }
      }
    });
  }

  dismissPopup(requestId: string): void {
    const index = this.pendingPopups.findIndex(p => p.id === requestId);
    this.pendingPopups = this.pendingPopups.filter(p => p.id !== requestId);
    // Adjust currentIndex if needed
    if (this.currentIndex >= this.pendingPopups.length && this.currentIndex > 0) {
      this.currentIndex = this.pendingPopups.length - 1;
    }
  }

  dismissCurrentPopup(): void {
    if (this.currentRequest) {
      this.dismissPopup(this.currentRequest.id);
    }
  }

  nextRequest(): void {
    if (this.currentIndex < this.pendingPopups.length - 1) {
      this.currentIndex++;
    }
  }

  previousRequest(): void {
    if (this.currentIndex > 0) {
      this.currentIndex--;
    }
  }

  acceptRequest(request: PendingRequestWithRide): void {
    this.processingRequest = request.id;
    this.processingAction = 'accept';

    this.rideService.acceptRequest(request.id).subscribe({
      next: () => {
        this.dismissPopup(request.id);
        this.processingRequest = null;
        this.processingAction = null;
      },
      error: () => {
        this.processingRequest = null;
        this.processingAction = null;
      }
    });
  }

  rejectRequest(request: PendingRequestWithRide): void {
    this.processingRequest = request.id;
    this.processingAction = 'reject';

    this.rideService.rejectRequest(request.id).subscribe({
      next: () => {
        this.dismissPopup(request.id);
        this.processingRequest = null;
        this.processingAction = null;
      },
      error: () => {
        this.processingRequest = null;
        this.processingAction = null;
      }
    });
  }

  viewDetails(request: PendingRequestWithRide): void {
    this.dismissPopup(request.id);
    this.router.navigate(['/rider'], { queryParams: { tab: 'requests', requestId: request.id } });
  }

  getShortAddress(address: string): string {
    if (!address) return '';
    const parts = address.split(',');
    return parts.slice(0, 2).join(',').trim();
  }

  formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return date.toLocaleDateString();
  }
}
