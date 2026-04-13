import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { RideService } from '../../../services/ride.service';
import { AuthService } from '../../../services/auth.service';
import { RideChatService } from '../../../services/ride-chat.service';
import { Ride } from '../../../models/ride.model';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../components/confirm-dialog/confirm-dialog.component';
import { RideChatComponent } from '../../../components/ride-chat/ride-chat.component';
import { ReportDialogComponent, ReportDialogData } from '../../../components/report-dialog/report-dialog.component';
import { RideStatusDialogComponent, RideStatusDialogData } from '../../../components/ride-status-dialog/ride-status-dialog.component';
import { trigger, transition, style, animate } from '@angular/animations';

type RidePhase = 'loading' | 'pickup' | 'arrived' | 'inprogress' | 'completed';

@Component({
  selector: 'app-active-ride',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    RideChatComponent
  ],
  animations: [
    trigger('fadeSlide', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ],
  template: `
    <div class="active-ride-container">
      <!-- Loading State -->
      @if (phase === 'loading') {
        <div class="loading-state">
          <mat-spinner diameter="50"></mat-spinner>
          <p>Loading ride details...</p>
        </div>
      }

      <!-- Error State -->
      @if (error) {
        <div class="error-state">
          <div class="error-icon">
            <mat-icon>error_outline</mat-icon>
          </div>
          <h2>Unable to load ride</h2>
          <p>{{ error }}</p>
          <button class="action-btn primary" (click)="goBack()">
            <mat-icon>arrow_back</mat-icon>
            Go Back
          </button>
        </div>
      }

      <!-- Ride Active -->
      @if (ride && !error) {
        <!-- Header -->
        <div class="ride-header" [class.inprogress]="phase === 'inprogress'">
          <button class="back-btn" (click)="goBack()">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div class="header-content">
            <span class="header-title">
              @switch (phase) {
                @case ('pickup') { Go to Pickup }
                @case ('arrived') { Waiting for Passenger }
                @case ('inprogress') { Ride In Progress }
                @case ('completed') { Ride Completed }
              }
            </span>
            <span class="header-status">
              @switch (phase) {
                @case ('pickup') { Navigate to passenger }
                @case ('arrived') { Start when ready }
                @case ('inprogress') { Navigate to dropoff }
                @case ('completed') { Great job! }
              }
            </span>
          </div>
        </div>

        <!-- Map Placeholder with Location -->
        <div class="map-section" @fadeSlide>
          <div class="map-placeholder">
            <mat-icon>map</mat-icon>
            <span>{{ phase === 'inprogress' ? 'Dropoff Location' : 'Pickup Location' }}</span>
          </div>
          
          <!-- Location Card -->
          <div class="location-card">
            <div class="location-marker" [class.dropoff]="phase === 'inprogress'">
              <mat-icon>{{ phase === 'inprogress' ? 'location_on' : 'my_location' }}</mat-icon>
            </div>
            <div class="location-info">
              <span class="location-label">{{ phase === 'inprogress' ? 'Dropoff' : 'Pickup' }}</span>
              <span class="location-address">{{ phase === 'inprogress' ? ride.destination : ride.origin }}</span>
            </div>
            <button class="navigate-btn" (click)="openNavigation()">
              <mat-icon>directions</mat-icon>
              Navigate
            </button>
          </div>
        </div>

        <!-- Passenger Info -->
        <div class="passenger-section" @fadeSlide>
          <div class="section-title">
            <mat-icon>person</mat-icon>
            <span>Passenger</span>
          </div>
          
          <div class="passenger-card">
            <div class="passenger-avatar">
              @if (ride.passengerPhoto) {
                <img [src]="ride.passengerPhoto" alt="Passenger">
              } @else {
                <mat-icon>person</mat-icon>
              }
            </div>
            <div class="passenger-details">
              <span class="passenger-name">{{ ride.passengerName || 'Passenger' }}</span>
              <span class="passenger-phone">{{ ride.passengerPhone || 'No phone available' }}</span>
            </div>
            @if (ride.passengerPhone) {
              <a class="call-btn" [href]="'tel:' + ride.passengerPhone">
                <mat-icon>phone</mat-icon>
              </a>
            }
          </div>
        </div>

        <!-- Trip Details -->
        <div class="trip-section" @fadeSlide>
          <div class="section-title">
            <mat-icon>route</mat-icon>
            <span>Trip Route</span>
          </div>
          
          <div class="trip-route">
            <div class="route-point">
              <div class="point-marker pickup">P</div>
              <div class="point-text">{{ ride.origin }}</div>
            </div>
            <div class="route-line"></div>
            <div class="route-point">
              <div class="point-marker dropoff">D</div>
              <div class="point-text">{{ ride.destination }}</div>
            </div>
          </div>
        </div>

        <!-- Chat Section -->
        @if (currentUserId && rideId) {
          <div class="chat-section" @fadeSlide>
            <app-ride-chat
              [rideId]="rideId"
              [currentUserId]="currentUserId"
              [maxMessages]="2"
            ></app-ride-chat>
          </div>
        }

        <!-- Action Buttons -->
        <div class="action-section">
          <div class="quick-options">
            <button class="option-btn" type="button" (click)="callPassenger()" [disabled]="!ride.passengerPhone">
              <mat-icon>phone</mat-icon>
              Call
            </button>
            <button class="option-btn" type="button" (click)="openNavigation()">
              <mat-icon>navigation</mat-icon>
              Navigate
            </button>
            @if (phase !== 'completed') {
              <button class="option-btn danger" type="button" (click)="confirmCancelRide()" [disabled]="processing">
                <mat-icon>cancel</mat-icon>
                Cancel
              </button>
            }
          </div>

          @switch (phase) {
            @case ('pickup') {
              <button class="action-btn secondary" (click)="confirmArrivedAtPickup()" [disabled]="processing">
                <mat-icon>check_circle</mat-icon>
                Arrived at Pickup
              </button>
            }
            @case ('arrived') {
              <button class="action-btn primary" (click)="confirmStartRide()" [disabled]="processing">
                @if (processing) {
                  <mat-spinner diameter="24"></mat-spinner>
                } @else {
                  <mat-icon>play_arrow</mat-icon>
                }
                {{ processing ? 'Starting...' : 'Start Ride' }}
              </button>
            }
            @case ('inprogress') {
              <button class="action-btn complete" (click)="confirmCompleteRide()" [disabled]="processing">
                @if (processing) {
                  <mat-spinner diameter="24"></mat-spinner>
                } @else {
                  <mat-icon>check</mat-icon>
                }
                {{ processing ? 'Completing...' : 'Complete Ride' }}
              </button>
            }
            @case ('completed') {
              <div class="completed-actions">
                <button class="action-btn ghost" (click)="goBack()">
                  <mat-icon>list_alt</mat-icon>
                  My Rides
                </button>
                <button class="action-btn primary" (click)="goToNearby()">
                  <mat-icon>wifi_tethering</mat-icon>
                  Get New Requests
                </button>
              </div>
            }
          }
        </div>

        <!-- Report Link (subtle, at bottom) -->
        <div class="report-link-section">
          <button class="report-text-link" type="button" (click)="reportPassenger()">
            Report an issue with this ride
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .active-ride-container {
      min-height: 100vh;
      background: var(--bg-primary);
      display: flex;
      flex-direction: column;
      padding-bottom: 140px;
    }

    /* Loading & Error States */
    .loading-state, .error-state {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 24px;
      text-align: center;

      p {
        margin-top: 16px;
        color: var(--text-muted);
        font-size: 15px;
      }
    }

    .error-icon {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: #ffebee;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 20px;

      mat-icon {
        font-size: 40px;
        width: 40px;
        height: 40px;
        color: #f44336;
      }
    }

    .error-state h2 {
      font-size: 20px;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 8px;
    }

    /* Header */
    .ride-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 20px;
      background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
      color: white;

      &.inprogress {
        background: linear-gradient(135deg, #4caf50 0%, #2e7d32 100%);
      }
    }

    .back-btn {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: none;
      background: rgba(255, 255, 255, 0.2);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }

    .header-content {
      display: flex;
      flex-direction: column;
    }

    .header-title {
      font-size: 18px;
      font-weight: 600;
    }

    .header-status {
      font-size: 13px;
      opacity: 0.9;
    }

    /* Map Section */
    .map-section {
      position: relative;
      height: 200px;
      background: var(--bg-secondary);
    }

    .map-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: var(--text-muted);

      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        margin-bottom: 8px;
      }
    }

    .location-card {
      position: absolute;
      bottom: -30px;
      left: 16px;
      right: 16px;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: var(--bg-card);
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    }

    .location-marker {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: linear-gradient(135deg, #4caf50, #2e7d32);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      &.dropoff {
        background: linear-gradient(135deg, #f44336, #c62828);
      }

      mat-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
        color: white;
      }
    }

    .location-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .location-label {
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      color: var(--text-muted);
    }

    .location-address {
      font-size: 14px;
      font-weight: 500;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .navigate-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 10px 16px;
      background: linear-gradient(135deg, #034694 0%, #0A56A4 100%);
      color: white;
      border: none;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      flex-shrink: 0;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    }

    /* Passenger Section */
    .passenger-section, .trip-section {
      padding: 16px 20px;
      margin-top: 40px;
    }

    .trip-section {
      margin-top: 0;
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 600;
      color: var(--text-muted);
      margin-bottom: 12px;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: var(--primary);
      }
    }

    .passenger-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: var(--bg-card);
      border-radius: 16px;
      box-shadow: 0 2px 8px var(--shadow);
    }

    .passenger-avatar {
      width: 52px;
      height: 52px;
      border-radius: 50%;
      background: linear-gradient(135deg, #034694 0%, #0A56A4 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      flex-shrink: 0;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      mat-icon {
        font-size: 28px;
        width: 28px;
        height: 28px;
        color: white;
      }
    }

    .passenger-details {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .passenger-name {
      font-size: 16px;
      font-weight: 600;
      color: var(--text-primary);
    }

    .passenger-phone {
      font-size: 14px;
      color: var(--text-muted);
    }

    .call-btn {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: linear-gradient(135deg, #4caf50, #2e7d32);
      display: flex;
      align-items: center;
      justify-content: center;
      text-decoration: none;

      mat-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
        color: white;
      }
    }

    /* Report Link Section */
    .report-link-section {
      padding: 24px 16px 16px;
      text-align: center;
    }

    .report-text-link {
      background: none;
      border: none;
      color: var(--text-muted);
      font-size: 13px;
      cursor: pointer;
      padding: 8px 12px;
      text-decoration: underline;
      opacity: 0.7;
      transition: opacity 0.2s ease;

      &:hover {
        opacity: 1;
        color: var(--text-secondary);
      }
    }

    /* Trip Route */
    .trip-route {
      background: var(--bg-card);
      border-radius: 16px;
      padding: 16px;
      box-shadow: 0 2px 8px var(--shadow);
    }

    .route-point {
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }

    .point-marker {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 700;
      color: white;
      flex-shrink: 0;

      &.pickup {
        background: linear-gradient(135deg, #4caf50, #2e7d32);
      }

      &.dropoff {
        background: linear-gradient(135deg, #f44336, #c62828);
      }
    }

    .point-text {
      font-size: 14px;
      color: var(--text-primary);
      padding-top: 4px;
    }

    .route-line {
      width: 2px;
      height: 20px;
      background: repeating-linear-gradient(
        to bottom,
        var(--text-muted) 0,
        var(--text-muted) 4px,
        transparent 4px,
        transparent 8px
      );
      margin-left: 13px;
      margin: 6px 0 6px 13px;
      opacity: 0.5;
    }

    /* Action Section */
    .action-section {
      position: fixed;
      bottom: 64px;
      left: 0;
      right: 0;
      padding: 12px 16px;
      padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px));
      background: var(--bg-card);
      border-top: 1px solid var(--border-color);
      z-index: 50;
      box-shadow: 0 -2px 12px rgba(0,0,0,0.08);
    }

    .quick-options {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 10px;
      margin-bottom: 12px;
    }

    .option-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 10px 8px;
      border: 1px solid var(--border-color);
      border-radius: 10px;
      background: var(--bg-secondary);
      color: var(--text-primary);
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      &:disabled {
        opacity: 0.55;
        cursor: not-allowed;
      }

      &.danger {
        color: #c62828;
        border-color: rgba(198, 40, 40, 0.35);
        background: rgba(198, 40, 40, 0.08);
      }
    }

    .completed-actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }

    .action-btn {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 16px 24px;
      border: none;
      border-radius: 14px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;

      mat-icon, mat-spinner {
        font-size: 24px;
        width: 24px;
        height: 24px;
      }

      &:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }

      &.primary {
        background: linear-gradient(135deg, #034694 0%, #0A56A4 100%);
        color: white;

        &:hover:not(:disabled) {
          transform: scale(1.02);
          box-shadow: 0 4px 14px rgba(3, 70, 148, 0.4);
        }
      }

      &.secondary {
        background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
        color: white;

        &:hover:not(:disabled) {
          transform: scale(1.02);
          box-shadow: 0 4px 14px rgba(255, 152, 0, 0.4);
        }
      }

      &.complete {
        background: linear-gradient(135deg, #4caf50 0%, #2e7d32 100%);
        color: white;

        &:hover:not(:disabled) {
          transform: scale(1.02);
          box-shadow: 0 4px 14px rgba(76, 175, 80, 0.4);
        }
      }

      &.ghost {
        background: var(--bg-secondary);
        color: var(--text-primary);
        border: 1px solid var(--border-color);
      }
    }

    // ── Chat Section ──
    .chat-toggle-section {
      padding: 16px;
      border-top: 1px solid #e0e0e0;
      background: var(--surface-variant, #f9f9f9);
    }

    .chat-toggle-btn {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 12px 16px;
      background: white;
      border: 2px solid #ddd;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      color: #333;
      cursor: pointer;
      transition: all 0.2s;

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      &:hover {
        border-color: #667eea;
        color: #667eea;
      }

      &.active {
        background: #667eea;
        border-color: #667eea;
        color: white;
      }
    }

    .chat-panel {
      margin-top: 12px;
      height: 320px;
      max-height: 320px;
      border-radius: 12px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      border: 1px solid #e0e0e0;
    }

    @media (max-width: 420px) {
      .quick-options {
        grid-template-columns: 1fr;
      }

      .completed-actions {
        grid-template-columns: 1fr;
      }

      .chat-panel {
        height: 280px;
        max-height: 280px;
      }
    }
  `]
})
export class ActiveRideComponent implements OnInit, OnDestroy {
  rideId: string | null = null;
  ride: Ride | null = null;
  phase: RidePhase = 'loading';
  error: string | null = null;
  processing = false;
  showChat = false;
  currentUserId: string | null = null;
  
  private locationWatchId: number | null = null;
  private currentLat = 0;
  private currentLng = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private rideService: RideService,
    private authService: AuthService,
    private rideChatService: RideChatService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Get current user ID
    this.authService.getCurrentUser().subscribe({
      next: (user) => {
        if (user && user.id) {
          this.currentUserId = user.id;
          // Initialize chat connection
          this.initializeChat();
        }
      }
    });

    this.rideId = this.route.snapshot.paramMap.get('id');
    if (this.rideId) {
      this.loadRide();
      this.watchLocation();
    } else {
      this.error = 'No ride ID provided';
      this.phase = 'loading';
    }
  }

  private initializeChat(): void {
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
    if (!token) {
      console.warn('No token found - chat will not initialize');
      return;
    }

    console.log('Initializing chat connection...');
    this.rideChatService.initializeConnection(token)
      .then(() => {
        console.log('✅ Chat connection initialized successfully');
      })
      .catch(err => {
        console.error('❌ Chat init failed:', err);
        // Note: Error will be displayed in the chat component via the error$ observable
      });
  }

  ngOnDestroy(): void {
    if (this.locationWatchId !== null) {
      navigator.geolocation.clearWatch(this.locationWatchId);
    }
  }

  private loadRide(): void {
    if (!this.rideId) return;
    
    this.rideService.getRide(this.rideId).subscribe({
      next: (ride) => {
        this.ride = ride;
        this.determinePhase();
      },
      error: () => {
        this.error = 'Failed to load ride details';
      }
    });
  }

  private determinePhase(): void {
    if (!this.ride) return;
    
    switch (this.ride.status) {
      case 'Booked':
        this.phase = 'pickup';
        break;
      case 'InProgress':
        this.phase = 'inprogress';
        break;
      case 'Completed':
        this.phase = 'completed';
        break;
      default:
        this.phase = 'pickup';
    }
  }

  private watchLocation(): void {
    if (!navigator.geolocation) return;
    
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.currentLat = pos.coords.latitude;
        this.currentLng = pos.coords.longitude;
      }
    );
    
    this.locationWatchId = navigator.geolocation.watchPosition(
      (pos) => {
        this.currentLat = pos.coords.latitude;
        this.currentLng = pos.coords.longitude;
      }
    );
  }

  private arrivedAtPickup(): void {
    if (!this.rideId) return;
    this.processing = true;
    this.rideService.arrivedAtPickup(this.rideId).subscribe({
      next: () => {
        this.phase = 'arrived';
        this.processing = false;
        this.snackBar.open('Passenger has been notified of your arrival.', 'OK', { duration: 3000 });
      },
      error: () => {
        this.phase = 'arrived';
        this.processing = false;
        this.snackBar.open('Waiting for passenger...', 'OK', { duration: 2000 });
      }
    });
  }

  private startRide(): void {
    if (!this.rideId || this.processing) return;
    
    this.processing = true;
    this.rideService.startRide(this.rideId, { 
      lat: this.currentLat, 
      lng: this.currentLng 
    }).subscribe({
      next: () => {
        this.processing = false;
        this.phase = 'inprogress';
        this.snackBar.open('Ride started! Navigate to dropoff.', 'OK', { duration: 2000 });
      },
      error: (err) => {
        this.processing = false;
        this.snackBar.open(err.error?.message || 'Failed to start ride', 'OK', { duration: 3000 });
      }
    });
  }

  private completeRide(): void {
    if (!this.rideId || this.processing) return;

    this.processing = true;
    this.rideService.completeRide(this.rideId).subscribe({
      next: () => {
        // Re-fetch ride to get updated fare/distance computed by backend
        this.rideService.getRide(this.rideId!).subscribe({
          next: (updatedRide) => {
            this.ride = updatedRide;
            this.processing = false;
            this.phase = 'completed';
            this.openCompletedDialog();
          },
          error: () => {
            // Fallback: open dialog with existing data
            this.processing = false;
            this.phase = 'completed';
            this.openCompletedDialog();
          }
        });
      },
      error: (err) => {
        this.processing = false;
        this.snackBar.open(err.error?.message || 'Failed to complete ride', 'OK', { duration: 3000 });
      }
    });
  }

  private openCompletedDialog(): void {
    this.dialog.open(RideStatusDialogComponent, {
      width: '420px',
      maxWidth: '95vw',
      disableClose: true,
      panelClass: 'ride-notification-dialog',
      data: {
        type: 'completed',
        rideId: this.rideId!,
        riderName: this.ride?.passengerName || 'Passenger',
        origin: this.ride?.origin || '',
        destination: this.ride?.destination || '',
        isRider: true,
        startedAt: this.ride?.startedAt,
        completedAt: new Date().toISOString(),
        fare: this.ride?.fare,
        distanceKm: this.ride?.estimatedDistanceKm
      } as RideStatusDialogData
    }).afterClosed().subscribe(result => {
      if (result === 'completed') {
        this.router.navigate(['/rider/my-rides']);
      }
    });
  }

  callPassenger(): void {
    if (!this.ride?.passengerPhone) {
      this.snackBar.open('Passenger phone is not available', 'OK', { duration: 2000 });
      return;
    }
    window.location.href = `tel:${this.ride.passengerPhone}`;
  }

  openNavigation(): void {
    if (!this.ride) return;
    
    const destination = this.phase === 'inprogress' 
      ? { lat: this.ride.destLat, lng: this.ride.destLng }
      : { lat: this.ride.originLat, lng: this.ride.originLng };
    
    // Open Google Maps or Waze for navigation
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}&travelmode=driving`;
    window.open(url, '_blank');
  }

  goBack(): void {
    this.router.navigate(['/rider/my-rides']);
  }

  goToNearby(): void {
    this.router.navigate(['/rider/nearby-requests']);
  }

  confirmArrivedAtPickup(): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '340px',
      maxWidth: '95vw',
      data: {
        title: 'Arrived at Pickup?',
        message: 'Confirm you have reached the passenger pickup point.',
        confirmText: 'Yes, I Arrived',
        cancelText: 'Not Yet',
        confirmColor: 'primary',
        icon: 'pin_drop'
      } as ConfirmDialogData
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.arrivedAtPickup();
      }
    });
  }

  confirmStartRide(): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '340px',
      maxWidth: '95vw',
      data: {
        title: 'Start Ride?',
        message: 'This will notify the passenger that the trip has started and begin live tracking.',
        confirmText: 'Start Now',
        cancelText: 'Wait',
        confirmColor: 'primary',
        icon: 'play_circle'
      } as ConfirmDialogData
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.startRide();
      }
    });
  }

  confirmCompleteRide(): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '340px',
      maxWidth: '95vw',
      data: {
        title: 'Complete Ride?',
        message: 'Confirm passenger has been dropped off safely. This action ends the ride.',
        confirmText: 'Complete Ride',
        cancelText: 'Not Yet',
        confirmColor: 'primary',
        icon: 'check_circle'
      } as ConfirmDialogData
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.completeRide();
      }
    });
  }

  confirmCancelRide(): void {
    if (!this.rideId || this.processing) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '340px',
      maxWidth: '95vw',
      data: {
        title: 'Cancel Ride?',
        message: 'This will cancel the current trip for both rider and passenger.',
        confirmText: 'Cancel Ride',
        cancelText: 'Keep Ride',
        confirmColor: 'warn',
        icon: 'cancel'
      } as ConfirmDialogData
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;

      this.processing = true;
      this.rideService.cancelRide(this.rideId!).subscribe({
        next: () => {
          this.processing = false;
          this.snackBar.open('Ride cancelled', 'OK', { duration: 2000 });
          this.goBack();
        },
        error: (err) => {
          this.processing = false;
          this.snackBar.open(err.error?.message || 'Failed to cancel ride', 'OK', { duration: 3000 });
        }
      });
    });
  }

  reportPassenger(): void {
    if (!this.ride) return;
    const passengerName = this.ride.passengerName || 'Passenger';
    const passengerId = this.ride.passengerId;
    if (!passengerId) {
      this.snackBar.open('No passenger to report', 'OK', { duration: 2000 });
      return;
    }
    this.dialog.open(ReportDialogComponent, {
      width: '440px',
      maxWidth: '95vw',
      data: {
        reportedUserId: passengerId,
        reportedUserName: passengerName,
        rideId: this.rideId
      } as ReportDialogData
    });
  }
}
