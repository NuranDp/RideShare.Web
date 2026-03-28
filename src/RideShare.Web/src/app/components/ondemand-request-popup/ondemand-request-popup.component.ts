import { Component, OnInit, OnDestroy, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { NotificationService } from '../../services/notification.service';
import { OnDemandService } from '../../services/on-demand.service';
import { AuthService } from '../../services/auth.service';
import { NearbyRequest } from '../../models/on-demand.model';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-ondemand-request-popup',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatRippleModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './ondemand-request-popup.component.html',
  styleUrls: ['./ondemand-request-popup.component.scss'],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateY(100%)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ transform: 'translateY(100%)', opacity: 0 }))
      ])
    ])
  ]
})
export class OndemandRequestPopupComponent implements OnInit, OnDestroy {
  private notificationService = inject(NotificationService);
  private onDemandService = inject(OnDemandService);
  private authService = inject(AuthService);
  private router = inject(Router);

  pendingPopups: NearbyRequest[] = [];
  currentIndex = 0;
  processingRequest: string | null = null;
  processingAction: 'accept' | 'dismiss' | null = null;

  private pollInterval: any;
  private countdownInterval: any;
  private seenRequestIds = new Set<string>();
  private isPolling = false;
  private isCheckingRequests = false;

  // Track countdown timers
  countdowns: Map<string, number> = new Map();

  get currentRequest(): NearbyRequest {
    return this.pendingPopups[this.currentIndex];
  }

  get currentCountdown(): number {
    if (!this.currentRequest) return 0;
    return this.countdowns.get(this.currentRequest.id) || 0;
  }

  constructor() {
    // Watch for availability changes using effect
    effect(() => {
      const isAvailable = this.onDemandService.isAvailable();
      const user = this.authService.currentUser();
      
      console.log('[Popup] Effect triggered - isAvailable:', isAvailable, 'user role:', user?.role);
      
      if (user?.role === 'Rider' && isAvailable) {
        console.log('[Popup] Starting polling...');
        this.startPolling();
      } else {
        console.log('[Popup] Stopping polling - conditions not met');
        this.stopPolling();
      }
    });
  }

  ngOnInit(): void {
    console.log('[Popup] Component initialized');
    
    // Also check on init (in case effect didn't trigger)
    const isAvailable = this.onDemandService.isAvailable();
    const user = this.authService.currentUser();
    const storedAvailable = localStorage.getItem('riderAvailable') === 'true';
    
    console.log('[Popup] ngOnInit - signal isAvailable:', isAvailable, 'localStorage available:', storedAvailable, 'user role:', user?.role);
    
    // Start polling if either signal or localStorage says we're available
    if (user?.role === 'Rider' && (isAvailable || storedAvailable)) {
      console.log('[Popup] Starting polling from ngOnInit');
      this.startPolling();
    }
    
    // Update countdowns every second
    this.countdownInterval = setInterval(() => {
      this.updateCountdowns();
    }, 1000);
    
    // Also set up a periodic check for availability changes (fallback)
    setInterval(() => {
      const currentAvailable = localStorage.getItem('riderAvailable') === 'true';
      const currentUser = this.authService.currentUser();
      if (currentUser?.role === 'Rider' && currentAvailable && !this.isPolling) {
        console.log('[Popup] Detected availability change from localStorage, starting polling');
        this.startPolling();
      } else if (!currentAvailable && this.isPolling) {
        console.log('[Popup] Detected unavailability from localStorage, stopping polling');
        this.stopPolling();
      }
    }, 2000);
  }

  ngOnDestroy(): void {
    this.stopPolling();
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  private startPolling(): void {
    if (this.isPolling) {
      console.log('[Popup] Already polling, skipping');
      return;
    }
    this.isPolling = true;
    console.log('[Popup] Polling started');
    
    // Initial check
    this.checkForNewRequests();
    
    // Poll every 5 seconds for new requests
    this.pollInterval = setInterval(() => {
      console.log('[Popup] Poll interval tick');
      this.checkForNewRequests();
    }, 5000);
  }

  private stopPolling(): void {
    this.isPolling = false;
    if (this.pollInterval) {
      console.log('[Popup] Polling stopped');
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  private checkForNewRequests(): void {
    // Prevent duplicate calls
    if (this.isCheckingRequests) {
      console.log('[Popup] Already checking, skipping');
      return;
    }
    this.isCheckingRequests = true;
    
    const currentLat = this.getCurrentLat();
    const currentLng = this.getCurrentLng();
    
    console.log('[Popup] Checking for new requests at:', currentLat, currentLng);
    
    if (!currentLat || !currentLng) {
      console.log('[Popup] No location available');
      this.isCheckingRequests = false;
      return;
    }

    this.onDemandService.getNearbyRequests(currentLat, currentLng, 10).subscribe({
      next: (response) => {
        this.isCheckingRequests = false;
        console.log('[Popup] Got response:', response.requests.length, 'requests, isRiderVerified:', response.isRiderVerified);
        
        if (!response.isRiderVerified) {
          console.log('[Popup] Rider not verified, skipping');
          return;
        }
        
        // Find new requests we haven't seen
        for (const request of response.requests) {
          console.log('[Popup] Checking request:', request.id, 'already seen:', this.seenRequestIds.has(request.id));
          
          if (!this.seenRequestIds.has(request.id) && !this.pendingPopups.find(p => p.id === request.id)) {
            // Check if request has enough time remaining
            // Ensure UTC handling - if no timezone indicator, assume UTC
            let expiresAtStr = request.expiresAt;
            if (!expiresAtStr.endsWith('Z') && !expiresAtStr.includes('+')) {
              expiresAtStr += 'Z';
            }
            const expiresAt = new Date(expiresAtStr).getTime();
            const now = Date.now();
            const secondsRemaining = Math.floor((expiresAt - now) / 1000);
            
            console.log('[Popup] Time check:', {
              originalExpiresAt: request.expiresAt,
              parsedExpiresAt: expiresAtStr,
              expiresAtMs: expiresAt,
              nowMs: now,
              secondsRemaining
            });
            
            // Show popup if more than -60 seconds (allow some grace period for nearly expired ones)
            if (secondsRemaining < -60) {
              // Skip requests that are truly expired
              console.log('[Popup] Request already expired, skipping:', request.id);
              this.seenRequestIds.add(request.id);
              continue;
            }
            
            // New request! Add to popup queue
            console.log('[Popup] NEW REQUEST! Adding popup:', request.id, 'expires in', secondsRemaining, 'seconds');
            this.seenRequestIds.add(request.id);
            this.pendingPopups.push(request);
            this.initCountdown(request);
            console.log('[Popup] pendingPopups length:', this.pendingPopups.length);
          }
        }
      },
      error: (err) => {
        console.log('[Popup] Error fetching requests:', err);
        this.isCheckingRequests = false;
      }
    });
  }

  private getCurrentLat(): number {
    // Try to get from localStorage or default to Dhaka
    const stored = localStorage.getItem('riderCurrentLat');
    return stored ? parseFloat(stored) : 23.8103;
  }

  private getCurrentLng(): number {
    const stored = localStorage.getItem('riderCurrentLng');
    return stored ? parseFloat(stored) : 90.4125;
  }

  private initCountdown(request: NearbyRequest): void {
    // Parse the expiry time - ensure UTC handling
    let expiresAtStr = request.expiresAt;
    // If no timezone indicator, assume UTC
    if (!expiresAtStr.endsWith('Z') && !expiresAtStr.includes('+')) {
      expiresAtStr += 'Z';
    }
    const expiresAt = new Date(expiresAtStr).getTime();
    const now = Date.now();
    const serverSeconds = Math.floor((expiresAt - now) / 1000);
    
    // Ensure at least 120 seconds (2 minutes) for the popup display
    const seconds = Math.max(120, serverSeconds);
    this.countdowns.set(request.id, seconds);
    console.log('[Popup] Countdown initialized:', request.id, 'server seconds:', serverSeconds, 'display seconds:', seconds);
  }

  private updateCountdowns(): void {
    // Create a copy to avoid mutation during iteration
    const popupsCopy = [...this.pendingPopups];
    popupsCopy.forEach(request => {
      const current = this.countdowns.get(request.id) || 0;
      if (current > 0) {
        this.countdowns.set(request.id, current - 1);
      } else {
        // Request expired, remove it
        console.log('Popup countdown expired:', request.id);
        this.dismissPopup(request.id);
      }
    });
  }

  formatCountdown(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  dismissPopup(requestId: string): void {
    this.pendingPopups = this.pendingPopups.filter(p => p.id !== requestId);
    this.countdowns.delete(requestId);
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

  acceptRequest(request: NearbyRequest): void {
    this.processingRequest = request.id;
    this.processingAction = 'accept';

    this.onDemandService.acceptRequest(request.id).subscribe({
      next: (result) => {
        this.dismissPopup(request.id);
        this.processingRequest = null;
        this.processingAction = null;
        // Navigate to active ride page (Uber-like behavior)
        if (result.rideId) {
          this.router.navigate(['/rider/active-ride', result.rideId]);
        }
      },
      error: () => {
        this.processingRequest = null;
        this.processingAction = null;
      }
    });
  }

  viewOnMap(): void {
    this.router.navigate(['/rider/nearby-requests']);
    this.pendingPopups = [];
  }

  getShortAddress(address: string): string {
    if (!address) return 'Unknown';
    // Return first part before comma or first 25 chars
    const parts = address.split(',');
    const shortPart = parts[0].trim();
    return shortPart.length > 25 ? shortPart.substring(0, 25) + '...' : shortPart;
  }

  formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins === 1) return '1 min ago';
    if (diffMins < 60) return `${diffMins} mins ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return '1 hour ago';
    return `${diffHours} hours ago`;
  }
}
