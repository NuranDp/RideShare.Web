import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRippleModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { OnDemandService } from '../../../services/on-demand.service';
import { NotificationService } from '../../../services/notification.service';
import { LocationPickerComponent } from '../../../components/location-picker/location-picker.component';
import { CreateOnDemandRequest, OnDemandRequest } from '../../../models/on-demand.model';
import { Subscription } from 'rxjs';
import * as L from 'leaflet';

@Component({
  selector: 'app-request-ondemand',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatRippleModule,
    MatSnackBarModule,
    LocationPickerComponent
  ],
  templateUrl: './request-ondemand.component.html',
  styleUrls: ['./request-ondemand.component.scss']
})
export class RequestOnDemandComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('mapContainer') mapContainer!: ElementRef;
  
  // Form state
  pickupLocation = '';
  pickupLat = 0;
  pickupLng = 0;
  dropoffLocation = '';
  dropoffLat = 0;
  dropoffLng = 0;
  message = '';
  
  // UI state
  step: 'pickup' | 'dropoff' | 'confirm' | 'searching' | 'accepted' = 'pickup';
  submitting = false;
  
  // Active request
  activeRequest: OnDemandRequest | null = null;
  
  // Map
  private map: L.Map | null = null;
  private pickupMarker: L.Marker | null = null;
  private dropoffMarker: L.Marker | null = null;
  private routeLine: L.Polyline | null = null;
  
  // Timer
  private expirationTimer: any;
  remainingTime = 0;
  
  // Subscriptions
  private subscription = new Subscription();

  constructor(
    private onDemandService: OnDemandService,
    private notificationService: NotificationService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    // Check if navigation state has pre-filled locations from passenger dashboard
    const nav = this.router.getCurrentNavigation();
    const state = nav?.extras?.state as any;
    if (state?.pickupLocation && state?.dropoffLocation) {
      this.pickupLocation = state.pickupLocation;
      this.pickupLat = state.pickupLat;
      this.pickupLng = state.pickupLng;
      this.dropoffLocation = state.dropoffLocation;
      this.dropoffLat = state.dropoffLat;
      this.dropoffLng = state.dropoffLng;
      this.step = 'confirm';
    }
  }

  ngOnInit(): void {
    // Check for existing active request
    this.onDemandService.getMyRequests().subscribe({
      next: (requests) => {
        const searching = requests.find(r => r.status === 'Searching');
        // Only resume an accepted request if it was accepted recently (within 2 hours)
        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
        const accepted = requests.find(r => r.status === 'Accepted' && r.rideId && (r.acceptedAt || '') > twoHoursAgo);
        
        if (searching) {
          this.activeRequest = searching;
          this.populateFromRequest(searching);
          this.step = 'searching';
          this.startExpirationTimer();
          setTimeout(() => this.updateMapMarkers(), 200);
        } else if (accepted) {
          this.activeRequest = accepted;
          this.populateFromRequest(accepted);
          this.step = 'accepted';
          setTimeout(() => this.updateMapMarkers(), 200);
        }
      }
    });

    // Listen for on-demand notifications via Subject (works outside injection context)
    this.subscription.add(
      this.notificationService.onRideNotification$.subscribe(notification => {
        if (notification.type === 'ondemand_accepted' && this.step === 'searching') {
          this.handleAccepted(notification);
        }
        if (notification.type === 'ondemand_expired' && this.step === 'searching') {
          this.handleExpired();
        }
      })
    );
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initMap();
      // If pre-filled from dashboard, draw markers after map init
      if (this.step === 'confirm' && this.pickupLat && this.dropoffLat) {
        setTimeout(() => this.updateMapMarkers(), 400);
      }
    }, 100);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    if (this.expirationTimer) {
      clearInterval(this.expirationTimer);
    }
    if (this.map) {
      this.map.remove();
    }
  }

  private populateFromRequest(request: OnDemandRequest): void {
    this.pickupLocation = request.pickupLocation;
    this.pickupLat = request.pickupLat;
    this.pickupLng = request.pickupLng;
    this.dropoffLocation = request.dropoffLocation;
    this.dropoffLat = request.dropoffLat;
    this.dropoffLng = request.dropoffLng;
  }

  private initMap(): void {
    if (!this.mapContainer?.nativeElement) return;
    
    this.map = L.map(this.mapContainer.nativeElement, {
      zoomControl: false
    }).setView([23.8103, 90.4125], 12); // Default to Dhaka

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(this.map);

    L.control.zoom({ position: 'bottomright' }).addTo(this.map);

    // Try to get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          this.map?.setView([latitude, longitude], 14);
        },
        () => {}
      );
    }
  }

  onPickupSelected(location: { address?: string; lat: number; lng: number }): void {
    this.pickupLocation = location.address || `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;
    this.pickupLat = location.lat;
    this.pickupLng = location.lng;
    this.updateMapMarkers();
  }

  onDropoffSelected(location: { address?: string; lat: number; lng: number }): void {
    this.dropoffLocation = location.address || `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;
    this.dropoffLat = location.lat;
    this.dropoffLng = location.lng;
    this.updateMapMarkers();
  }

  private updateMapMarkers(): void {
    if (!this.map) return;

    // Clear existing
    if (this.pickupMarker) this.pickupMarker.remove();
    if (this.dropoffMarker) this.dropoffMarker.remove();
    if (this.routeLine) this.routeLine.remove();

    // Pickup marker
    if (this.pickupLat && this.pickupLng) {
      const pickupIcon = L.divIcon({
        className: 'custom-marker pickup-marker',
        html: '<div class="marker-pin pickup"><span>P</span></div>',
        iconSize: [30, 42],
        iconAnchor: [15, 42]
      });
      this.pickupMarker = L.marker([this.pickupLat, this.pickupLng], { icon: pickupIcon })
        .addTo(this.map);
    }

    // Dropoff marker
    if (this.dropoffLat && this.dropoffLng) {
      const dropoffIcon = L.divIcon({
        className: 'custom-marker dropoff-marker',
        html: '<div class="marker-pin dropoff"><span>D</span></div>',
        iconSize: [30, 42],
        iconAnchor: [15, 42]
      });
      this.dropoffMarker = L.marker([this.dropoffLat, this.dropoffLng], { icon: dropoffIcon })
        .addTo(this.map);
    }

    // Draw real road route and fit bounds
    if (this.pickupLat && this.pickupLng && this.dropoffLat && this.dropoffLng) {
      this.drawOsrmRoute();
      const bounds = L.latLngBounds([
        [this.pickupLat, this.pickupLng],
        [this.dropoffLat, this.dropoffLng]
      ]);
      this.map.fitBounds(bounds, { padding: [60, 60] });
    } else if (this.pickupLat && this.pickupLng) {
      this.map.setView([this.pickupLat, this.pickupLng], 15);
    }
  }

  private drawOsrmRoute(): void {
    const url = `https://router.project-osrm.org/route/v1/driving/${this.pickupLng},${this.pickupLat};${this.dropoffLng},${this.dropoffLat}?overview=full&geometries=geojson`;
    fetch(url)
      .then(r => r.json())
      .then(data => {
        if (!this.map || !data?.routes?.[0]) return;
        if (this.routeLine) this.routeLine.remove();
        const coords: L.LatLngExpression[] = data.routes[0].geometry.coordinates.map(
          (c: [number, number]) => [c[1], c[0]] as L.LatLngExpression
        );
        this.routeLine = L.polyline(coords, {
          color: '#034694',
          weight: 4,
          opacity: 0.85
        }).addTo(this.map);
        this.map.fitBounds(this.routeLine.getBounds(), { padding: [60, 60] });
      })
      .catch(() => {
        // Fallback to straight line
        if (!this.map) return;
        this.routeLine = L.polyline([
          [this.pickupLat, this.pickupLng],
          [this.dropoffLat, this.dropoffLng]
        ], { color: '#034694', weight: 3, dashArray: '10, 10' }).addTo(this.map);
      });
  }

  nextStep(): void {
    if (this.step === 'pickup' && this.pickupLocation) {
      this.step = 'dropoff';
    } else if (this.step === 'dropoff' && this.dropoffLocation) {
      this.step = 'confirm';
    }
  }

  prevStep(): void {
    if (this.step === 'dropoff') {
      this.step = 'pickup';
    } else if (this.step === 'confirm') {
      this.step = 'dropoff';
    }
  }

  submitRequest(): void {
    if (!this.pickupLocation || !this.dropoffLocation) return;

    this.submitting = true;

    const request: CreateOnDemandRequest = {
      pickupLocation: this.pickupLocation,
      pickupLat: this.pickupLat,
      pickupLng: this.pickupLng,
      dropoffLocation: this.dropoffLocation,
      dropoffLat: this.dropoffLat,
      dropoffLng: this.dropoffLng,
      isScheduled: false,
      message: this.message || undefined
    };

    this.onDemandService.createRequest(request).subscribe({
      next: (response) => {
        this.activeRequest = response;
        this.step = 'searching';
        this.submitting = false;
        this.startExpirationTimer();
        this.snackBar.open('Request sent! Looking for nearby riders...', 'OK', { duration: 3000 });
      },
      error: (err) => {
        this.submitting = false;
        this.snackBar.open(err.error?.message || 'Failed to create request', 'OK', { duration: 3000 });
      }
    });
  }

  cancelRequest(): void {
    if (!this.activeRequest) return;

    this.onDemandService.cancelRequest(this.activeRequest.id).subscribe({
      next: () => {
        this.activeRequest = null;
        this.step = 'pickup';
        if (this.expirationTimer) {
          clearInterval(this.expirationTimer);
        }
        this.snackBar.open('Request cancelled', 'OK', { duration: 2000 });
      },
      error: () => {
        this.snackBar.open('Failed to cancel request', 'OK', { duration: 2000 });
      }
    });
  }

  private startExpirationTimer(): void {
    if (!this.activeRequest) return;

    const updateTimer = () => {
      const expiresAt = new Date(this.activeRequest!.expiresAt).getTime();
      const now = Date.now();
      this.remainingTime = Math.max(0, Math.floor((expiresAt - now) / 1000));

      if (this.remainingTime <= 0) {
        this.handleExpired();
      }
    };

    updateTimer();
    this.expirationTimer = setInterval(updateTimer, 1000);
  }

  private handleExpired(): void {
    if (this.expirationTimer) {
      clearInterval(this.expirationTimer);
    }
    this.activeRequest = null;
    this.step = 'pickup';
    this.snackBar.open('Request expired. No riders were available. Please try again.', 'OK', { duration: 4000 });
  }

  private handleAccepted(notification: any): void {
    if (this.expirationTimer) {
      clearInterval(this.expirationTimer);
    }
    
    this.step = 'accepted';
    
    // Refresh request to get full rider info
    if (this.activeRequest) {
      this.onDemandService.getRequest(this.activeRequest.id).subscribe({
        next: (request) => {
          this.activeRequest = request;
          this.updateMapMarkers();
        }
      });
    }
  }

  callRider(): void {
    if (this.activeRequest?.riderPhone) {
      window.location.href = `tel:${this.activeRequest.riderPhone}`;
    }
  }

  goToTracking(): void {
    if (this.activeRequest?.rideId) {
      this.router.navigate(['/passenger/track-ride', this.activeRequest.rideId]);
    }
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  getEstimatedDistance(): string {
    if (!this.pickupLat || !this.dropoffLat) return '';
    
    const R = 6371;
    const dLat = this.toRad(this.dropoffLat - this.pickupLat);
    const dLng = this.toRad(this.dropoffLng - this.pickupLng);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRad(this.pickupLat)) * Math.cos(this.toRad(this.dropoffLat)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return distance.toFixed(1) + ' km';
  }

  private toRad(deg: number): number {
    return deg * Math.PI / 180;
  }
}
