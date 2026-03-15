import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { Router, RouterLink } from '@angular/router';
import { RiderService } from '../../services/rider.service';
import { RiderProfile } from '../../models/rider.model';

@Component({
  selector: 'app-rider-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatChipsModule,
    MatDividerModule,
    RouterLink
  ],
  template: `
    <div class="profile-container">
      <mat-card class="profile-card">
        <mat-card-header>
          <mat-icon mat-card-avatar>sports_motorsports</mat-icon>
          <mat-card-title>Rider Profile</mat-card-title>
          <mat-card-subtitle>Manage your rider information and license verification</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          @if (loading()) {
            <div class="loading-container">
              <mat-spinner diameter="40"></mat-spinner>
              <p>Loading profile...</p>
            </div>
          } @else {
            <!-- Verification Status Banner -->
            <div class="status-banner" [class]="getStatusClass()">
              @if (profile()?.isLicenseVerified) {
                <mat-icon>verified</mat-icon>
                <span>You are a verified rider!</span>
              } @else if (profile()?.licenseNumber) {
                <mat-icon>hourglass_empty</mat-icon>
                <span>Your license verification is pending review</span>
              } @else {
                <mat-icon>info</mat-icon>
                <span>Submit your license for verification to start giving rides</span>
              }
            </div>

            <!-- Stats Section -->
            @if (profile()?.isLicenseVerified) {
              <div class="stats-section">
                <div class="stat-item">
                  <span class="stat-value">{{ profile()?.totalRides || 0 }}</span>
                  <span class="stat-label">Rides Given</span>
                </div>
                <div class="stat-item">
                  <span class="stat-value">{{ profile()?.averageRating?.toFixed(1) || 'N/A' }}</span>
                  <span class="stat-label">Rating</span>
                </div>
                <div class="stat-item">
                  <span class="stat-value">{{ profile()?.totalRatings || 0 }}</span>
                  <span class="stat-label">Reviews</span>
                </div>
              </div>
            }

            <mat-divider></mat-divider>

            <!-- Profile Form -->
            <form [formGroup]="profileForm" (ngSubmit)="updateProfile()" class="profile-form">
              <h3>Motorcycle Information</h3>
              
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Motorcycle Model</mat-label>
                <input matInput formControlName="motorcycleModel" placeholder="e.g., Honda CB150R">
                <mat-icon matSuffix>two_wheeler</mat-icon>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>License Plate Number</mat-label>
                <input matInput formControlName="plateNumber" placeholder="e.g., Dhaka Metro 12-3456">
                <mat-icon matSuffix>pin</mat-icon>
              </mat-form-field>

              <button 
                mat-raised-button 
                color="primary" 
                type="submit"
                [disabled]="saving() || !profileForm.dirty || !profileForm.valid">
                @if (saving()) {
                  <mat-spinner diameter="20"></mat-spinner>
                } @else {
                  <mat-icon>save</mat-icon>
                  Save Profile
                }
              </button>
            </form>

            <mat-divider></mat-divider>

            <!-- License Submission Section -->
            @if (!profile()?.isLicenseVerified) {
              <form [formGroup]="licenseForm" (ngSubmit)="submitLicense()" class="license-form">
                <h3>License Verification</h3>
                <p class="form-description">
                  Submit your driving license details for verification. 
                  An admin will review and approve your request.
                </p>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>License Number</mat-label>
                  <input matInput formControlName="licenseNumber" placeholder="Enter your license number">
                  <mat-icon matSuffix>badge</mat-icon>
                  @if (licenseForm.get('licenseNumber')?.hasError('required')) {
                    <mat-error>License number is required</mat-error>
                  }
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>License Expiry Date</mat-label>
                  <input matInput type="date" formControlName="licenseExpiryDate">
                  <mat-icon matSuffix>event</mat-icon>
                  @if (licenseForm.get('licenseExpiryDate')?.hasError('required')) {
                    <mat-error>Expiry date is required</mat-error>
                  }
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>License Image URL</mat-label>
                  <input matInput formControlName="licenseImageUrl" placeholder="URL to your license image">
                  <mat-icon matSuffix>image</mat-icon>
                  <mat-hint>Upload your image to a service and paste the URL here</mat-hint>
                  @if (licenseForm.get('licenseImageUrl')?.hasError('required')) {
                    <mat-error>License image URL is required</mat-error>
                  }
                </mat-form-field>

                <button 
                  mat-raised-button 
                  color="accent" 
                  type="submit"
                  [disabled]="submittingLicense() || !licenseForm.valid">
                  @if (submittingLicense()) {
                    <mat-spinner diameter="20"></mat-spinner>
                  } @else {
                    <mat-icon>upload</mat-icon>
                    Submit for Verification
                  }
                </button>
              </form>
            }
          }
        </mat-card-content>

        <mat-card-actions>
          <button mat-button routerLink="/rider">
            <mat-icon>arrow_back</mat-icon>
            Back to Dashboard
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .profile-container {
      max-width: 700px;
      margin: 2rem auto;
      padding: 0 1rem;
    }

    .profile-card {
      mat-card-header {
        margin-bottom: 1rem;
        
        mat-icon[mat-card-avatar] {
          font-size: 40px;
          width: 40px;
          height: 40px;
          background: #1976d2;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      }
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 2rem;
      gap: 1rem;
    }

    .status-banner {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem;
      border-radius: 8px;
      margin-bottom: 1rem;

      &.status-pending {
        background: #fff3e0;
        color: #e65100;
      }

      &.status-approved {
        background: #e8f5e9;
        color: #2e7d32;
      }

      &.status-rejected {
        background: #ffebee;
        color: #c62828;
      }

      &.status-notsubmitted, &.status-undefined {
        background: #e3f2fd;
        color: #1565c0;
      }
    }

    .stats-section {
      display: flex;
      justify-content: space-around;
      padding: 1.5rem 0;
      margin-bottom: 1rem;

      .stat-item {
        display: flex;
        flex-direction: column;
        align-items: center;

        .stat-value {
          font-size: 2rem;
          font-weight: bold;
          color: #1976d2;
        }

        .stat-label {
          font-size: 0.875rem;
          color: #666;
        }
      }
    }

    mat-divider {
      margin: 1.5rem 0;
    }

    .profile-form, .license-form {
      h3 {
        margin-bottom: 1rem;
        color: #333;
      }

      .form-description {
        color: #666;
        margin-bottom: 1rem;
      }
    }

    .full-width {
      width: 100%;
      margin-bottom: 0.5rem;
    }

    button[type="submit"] {
      margin-top: 1rem;
      
      mat-spinner {
        display: inline-block;
        margin-right: 8px;
      }
    }

    mat-card-actions {
      padding: 1rem;
    }

    @media (max-width: 480px) {
      .profile-container {
        padding: 1rem;
      }

      .stats-section {
        flex-wrap: wrap;
        gap: 16px;
        justify-content: center;
      }

      .stat-item .stat-value {
        font-size: 1.5rem;
      }

      mat-card {
        margin-bottom: 16px;
      }
    }
  `]
})
export class RiderProfileComponent implements OnInit {
  profile = signal<RiderProfile | null>(null);
  loading = signal(true);
  saving = signal(false);
  submittingLicense = signal(false);

  profileForm: FormGroup;
  licenseForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private riderService: RiderService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    this.profileForm = this.fb.group({
      motorcycleModel: [''],
      plateNumber: ['']
    });

    this.licenseForm = this.fb.group({
      licenseNumber: ['', Validators.required],
      licenseExpiryDate: ['', Validators.required],
      licenseImageUrl: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  getStatusClass(): string {
    const p = this.profile();
    if (p?.isLicenseVerified) return 'status-approved';
    if (p?.licenseNumber) return 'status-pending';
    return 'status-notsubmitted';
  }

  loadProfile(): void {
    this.loading.set(true);
    this.riderService.getMyProfile().subscribe({
      next: (profile) => {
        this.profile.set(profile);
        this.profileForm.patchValue({
          motorcycleModel: profile.motorcycleModel || '',
          plateNumber: profile.plateNumber || ''
        });
        this.profileForm.markAsPristine();
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading profile:', err);
        this.snackBar.open('Failed to load profile', 'Close', { duration: 3000 });
        this.loading.set(false);
      }
    });
  }

  updateProfile(): void {
    if (!this.profileForm.valid || !this.profileForm.dirty) return;

    this.saving.set(true);
    this.riderService.updateProfile(this.profileForm.value).subscribe({
      next: (profile) => {
        this.profile.set(profile);
        this.profileForm.markAsPristine();
        this.saving.set(false);
        this.snackBar.open('Profile updated successfully!', 'Close', { duration: 3000 });
      },
      error: (err) => {
        console.error('Error updating profile:', err);
        this.snackBar.open('Failed to update profile', 'Close', { duration: 3000 });
        this.saving.set(false);
      }
    });
  }

  submitLicense(): void {
    if (!this.licenseForm.valid) return;

    this.submittingLicense.set(true);
    this.riderService.submitLicense(this.licenseForm.value).subscribe({
      next: (response) => {
        this.profile.set(response.profile);
        this.licenseForm.reset();
        this.submittingLicense.set(false);
        this.snackBar.open(response.message, 'Close', { duration: 5000 });
      },
      error: (err) => {
        console.error('Error submitting license:', err);
        this.snackBar.open(err.error?.message || 'Failed to submit license', 'Close', { duration: 3000 });
        this.submittingLicense.set(false);
      }
    });
  }
}
