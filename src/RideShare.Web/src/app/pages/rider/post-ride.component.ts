import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MatRippleModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { RideService } from '../../services/ride.service';
import { CreateRideRequest } from '../../models/ride.model';
import { UnifiedRouteMapComponent, LocationCoordinates, RouteInfo } from '../../components/unified-route-map/unified-route-map.component';


@Component({
  selector: 'app-post-ride',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCheckboxModule,
    MatRippleModule,
    UnifiedRouteMapComponent
  ],
  template: `
    <!-- Top Bar -->
    <div class="top-bar">
      <button class="back-btn" matRipple routerLink="/rider">
        <mat-icon>arrow_back</mat-icon>
      </button>
      <div class="top-bar-title">
        <h1>Post a Ride</h1>
        <span class="subtitle">Share your commute</span>
      </div>
      <div class="top-bar-spacer"></div>
    </div>

    <!-- Main Content -->
    <div class="content-area">
      <form [formGroup]="rideForm" (ngSubmit)="onSubmit()">
        <!-- Step 1: Route Section -->
        <div class="form-section">
          <div class="section-header">
            <span class="step-badge">1</span>
            <h2>Route</h2>
          </div>

          <!-- Unified Route Map -->
          <app-unified-route-map
            (originSelected)="onOriginSelected($event)"
            (destinationSelected)="onDestSelected($event)"
            (routeCalculated)="onRouteCalculated($event)">
          </app-unified-route-map>
        </div>

        <!-- Step 2: Schedule Section -->
        <div class="form-section">
          <div class="section-header">
            <span class="step-badge">2</span>
            <h2>Schedule</h2>
          </div>

          <div class="schedule-grid">
            <div class="schedule-item">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Departure Date</mat-label>
                <input matInput [matDatepicker]="picker" formControlName="departureDate" [min]="minDate">
                <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
                <mat-datepicker #picker></mat-datepicker>
                @if (rideForm.get('departureDate')?.hasError('required')) {
                  <mat-error>Date is required</mat-error>
                }
              </mat-form-field>
            </div>

            <div class="schedule-item">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Departure Time</mat-label>
                <input matInput type="time" formControlName="departureTime">
                @if (rideForm.get('departureTime')?.hasError('required')) {
                  <mat-error>Time is required</mat-error>
                }
              </mat-form-field>
            </div>
          </div>
        </div>

        <!-- Step 3: Details Section -->
        <div class="form-section">
          <div class="section-header">
            <span class="step-badge">3</span>
            <h2>Details</h2>
          </div>

          <!-- Helmet Toggle -->
          <div class="option-card" matRipple (click)="toggleHelmet()">
            <div class="option-icon" [class.active]="rideForm.get('helmetProvided')?.value">
              <mat-icon>sports_motorsports</mat-icon>
            </div>
            <div class="option-content">
              <span class="option-title">Provide Helmet</span>
              <span class="option-desc">I will provide a helmet for my passenger</span>
            </div>
            <div class="option-toggle" [class.active]="rideForm.get('helmetProvided')?.value">
              <div class="toggle-track">
                <div class="toggle-thumb"></div>
              </div>
            </div>
          </div>

          <!-- Notes -->
          <div class="notes-card">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Notes (Optional)</mat-label>
              <textarea matInput formControlName="notes" rows="3"
                placeholder="Route details, pickup points, preferences..."></textarea>
              <mat-icon matPrefix>notes</mat-icon>
            </mat-form-field>
          </div>
        </div>

        <!-- Validation Warning -->
        @if (!originLocation || !destLocation) {
          <div class="warning-banner">
            <mat-icon>info</mat-icon>
            <span>Select both pickup and drop-off locations to continue</span>
          </div>
        }
      </form>
    </div>

    <!-- Bottom Action Bar -->
    <div class="bottom-bar">
      <button class="submit-btn" [disabled]="loading || !rideForm.valid || !originLocation || !destLocation"
              (click)="onSubmit()">
        @if (loading) {
          <mat-spinner diameter="24" color="accent"></mat-spinner>
        } @else {
          <mat-icon>add_circle</mat-icon>
          <span>Post Ride</span>
        }
      </button>
    </div>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      height: 100vh;
      background: #f5f7fa;
    }

    /* Top Bar */
    .top-bar {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .back-btn {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      border: none;
      background: #f5f7fa;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: #333;
    }

    .top-bar-title {
      flex: 1;
    }

    .top-bar-title h1 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #333;
    }

    .top-bar-title .subtitle {
      font-size: 13px;
      color: #666;
    }

    .top-bar-spacer {
      width: 40px;
    }

    /* Content Area */
    .content-area {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      padding-bottom: 100px;
    }

    /* Form Sections */
    .form-section {
      margin-bottom: 24px;
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }

    .step-badge {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: 600;
    }

    .section-header h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #333;
    }

    /* Location Cards - Removed, using unified map now */

    /* Schedule Grid */
    .schedule-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    @media (max-width: 480px) {
      .schedule-grid {
        grid-template-columns: 1fr;
      }
    }

    .schedule-item {
      background: white;
      padding: 16px;
      border-radius: 16px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    }

    .full-width {
      width: 100%;
    }

    /* Option Card (Helmet) */
    .option-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      background: white;
      border-radius: 16px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      cursor: pointer;
      margin-bottom: 12px;
    }

    .option-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: #f5f7fa;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s;
    }

    .option-icon mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
      color: #999;
      transition: color 0.3s;
    }

    .option-icon.active {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .option-icon.active mat-icon {
      color: white;
    }

    .option-content {
      flex: 1;
    }

    .option-title {
      display: block;
      font-size: 15px;
      font-weight: 500;
      color: #333;
    }

    .option-desc {
      display: block;
      font-size: 13px;
      color: #666;
      margin-top: 2px;
    }

    .option-toggle {
      width: 52px;
      height: 32px;
    }

    .toggle-track {
      width: 100%;
      height: 100%;
      background: #e0e0e0;
      border-radius: 16px;
      position: relative;
      transition: background 0.3s;
    }

    .option-toggle.active .toggle-track {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .toggle-thumb {
      position: absolute;
      top: 4px;
      left: 4px;
      width: 24px;
      height: 24px;
      background: white;
      border-radius: 50%;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      transition: transform 0.3s;
    }

    .option-toggle.active .toggle-thumb {
      transform: translateX(20px);
    }

    /* Notes Card */
    .notes-card {
      background: white;
      padding: 16px;
      border-radius: 16px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    }

    /* Warning Banner */
    .warning-banner {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: #fff8e1;
      border-radius: 12px;
      color: #f57c00;
      margin-top: 8px;
    }

    .warning-banner mat-icon {
      flex-shrink: 0;
    }

    .warning-banner span {
      font-size: 14px;
    }

    /* Bottom Action Bar */
    .bottom-bar {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 16px;
      padding-bottom: max(16px, env(safe-area-inset-bottom));
      background: white;
      box-shadow: 0 -4px 16px rgba(0,0,0,0.08);
      z-index: 100;
    }

    .submit-btn {
      width: 100%;
      padding: 16px 24px;
      border: none;
      border-radius: 16px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      font-size: 16px;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      cursor: pointer;
      transition: all 0.3s;
    }

    .submit-btn:disabled {
      background: #e0e0e0;
      color: #999;
      cursor: not-allowed;
    }

    .submit-btn:not(:disabled):active {
      transform: scale(0.98);
    }

    .submit-btn mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    /* Form Field Overrides */
    ::ng-deep .mat-mdc-form-field-subscript-wrapper {
      margin-bottom: 0;
    }

    ::ng-deep .location-picker-wrapper .mat-mdc-form-field {
      width: 100%;
    }

    /* Animations */
    .location-card {
      animation: fadeInUp 0.3s ease;
    }

    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `]
})
export class PostRideComponent implements OnInit {
  rideForm!: FormGroup;
  loading = false;
  minDate = new Date();
  
  originLocation: LocationCoordinates | null = null;
  destLocation: LocationCoordinates | null = null;
  routeInfo: RouteInfo | null = null;

  constructor(
    private fb: FormBuilder,
    private rideService: RideService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    this.rideForm = this.fb.group({
      origin: [''],
      destination: [''],
      departureDate: [new Date(), Validators.required],
      departureTime: [timeStr, Validators.required],
      helmetProvided: [false],
      notes: ['']
    });
  }

  toggleHelmet(): void {
    const current = this.rideForm.get('helmetProvided')?.value;
    this.rideForm.patchValue({ helmetProvided: !current });
  }

  onOriginSelected(location: LocationCoordinates): void {
    this.originLocation = location;
    this.rideForm.patchValue({ origin: location.address });
  }

  onDestSelected(location: LocationCoordinates): void {
    this.destLocation = location;
    this.rideForm.patchValue({ destination: location.address });
  }

  onRouteCalculated(routeInfo: RouteInfo): void {
    this.routeInfo = routeInfo;
  }

  onSubmit(): void {
    if (this.rideForm.invalid || !this.originLocation || !this.destLocation) return;

    this.loading = true;

    const formValue = this.rideForm.value;
    const departureDate = new Date(formValue.departureDate);
    const [hours, minutes] = formValue.departureTime.split(':');
    departureDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    const request: CreateRideRequest = {
      origin: this.originLocation.address || '',
      destination: this.destLocation.address || '',
      originLat: this.originLocation.lat,
      originLng: this.originLocation.lng,
      destLat: this.destLocation.lat,
      destLng: this.destLocation.lng,
      departureTime: departureDate.toISOString(),
      helmetProvided: formValue.helmetProvided,
      notes: formValue.notes || undefined
    };

    this.rideService.createRide(request).subscribe({
      next: () => {
        this.loading = false;
        this.snackBar.open('Ride posted successfully!', 'Close', { duration: 3000 });
        this.router.navigate(['/rider/my-rides']);
      },
      error: (err) => {
        this.loading = false;
        const message = err.error?.message || 'Failed to post ride. Make sure your license is verified.';
        this.snackBar.open(message, 'Close', { duration: 5000 });
      }
    });
  }
}
