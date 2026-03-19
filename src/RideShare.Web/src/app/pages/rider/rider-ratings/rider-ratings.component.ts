import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { RideService } from '../../../services/ride.service';
import { RiderService } from '../../../services/rider.service';
import { Rating } from '../../../models/ride.model';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-rider-ratings',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './rider-ratings.component.html',
  styleUrls: ['./rider-ratings.component.scss']
})
export class RiderRatingsComponent implements OnInit {
  loading = signal(true);
  ratings = signal<Rating[]>([]);
  averageRating = signal(0);
  totalRatings = signal(0);
  totalRides = signal(0);
  Math = Math;

  constructor(
    private rideService: RideService,
    private riderService: RiderService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadRatings();
    this.loadProfile();
  }

  loadProfile(): void {
    this.riderService.getMyProfile().subscribe({
      next: (profile) => {
        this.averageRating.set(profile.averageRating);
        this.totalRatings.set(profile.totalRatings);
        this.totalRides.set(profile.totalRides);
      },
      error: (err) => {
        console.error('Error loading profile:', err);
      }
    });
  }

  loadRatings(): void {
    const userId = this.authService.currentUser()?.id;
    if (!userId) {
      this.loading.set(false);
      return;
    }

    this.rideService.getRiderRatings(userId).subscribe({
      next: (ratings) => {
        this.ratings.set(ratings);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading ratings:', err);
        this.snackBar.open('Failed to load ratings', 'Close', { duration: 3000 });
        this.loading.set(false);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/rider'], { queryParams: { tab: 'profile' } });
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  getStarArray(score: number): number[] {
    return Array(5).fill(0).map((_, i) => i < score ? 1 : 0);
  }

  getRatingLabel(score: number): string {
    switch (score) {
      case 5: return 'Excellent';
      case 4: return 'Great';
      case 3: return 'Good';
      case 2: return 'Fair';
      case 1: return 'Poor';
      default: return '';
    }
  }
}
