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
import { RiderService } from '../../../services/rider.service';
import { RiderProfile } from '../../../models/rider.model';

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
  templateUrl: './rider-profile.component.html',
  styleUrls: ['./rider-profile.component.scss']
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
