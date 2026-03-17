import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatRippleModule } from '@angular/material/core';
import { RideService } from '../../../services/ride.service';
import { RideListItem, RideSearchParams } from '../../../models/ride.model';
import { RideMapComponent } from '../../../components/ride-map/ride-map.component';
import { RoutePreviewComponent } from '../../../components/route-preview/route-preview.component';
import { NotificationBellComponent } from '../../../components/notification-bell/notification-bell.component';

@Component({
  selector: 'app-browse-rides',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatRippleModule,
    RideMapComponent,
    RoutePreviewComponent,
    NotificationBellComponent
  ],
  templateUrl: './browse-rides.component.html',
  styleUrls: ['./browse-rides.component.scss']
})
export class BrowseRidesComponent implements OnInit {
  rides: RideListItem[] = [];
  loading = true;
  searchParams: RideSearchParams = {};
  viewMode: 'list' | 'map' = 'list';
  selectedRide: RideListItem | null = null;
  expandedRideId: string | null = null;
  searchCollapsed = true;

  constructor(
    private rideService: RideService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadRides();
  }

  get ridesWithCoords(): RideListItem[] {
    return this.rides.filter(r => r.originLat && r.originLng && r.destLat && r.destLng);
  }

  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'list' ? 'map' : 'list';
    this.selectedRide = null;
  }

  getShortAddress(fullAddress: string): string {
    if (!fullAddress) return '';
    const parts = fullAddress.split(/[,،]/);
    let shortAddr = parts[0].trim();
    return shortAddr.length > 20 ? shortAddr.substring(0, 20) + '...' : shortAddr;
  }

  toggleExpand(rideId: string): void {
    this.expandedRideId = this.expandedRideId === rideId ? null : rideId;
  }

  loadRides(): void {
    this.loading = true;
    this.rideService.getAvailableRides(this.searchParams).subscribe({
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

  searchRides(): void {
    this.searchCollapsed = true;
    this.loadRides();
  }

  clearSearch(): void {
    this.searchParams = {};
    this.loadRides();
  }

  onRideClicked(rideId: string): void {
    this.selectedRide = this.rides.find(r => r.id === rideId) || null;
  }

  formatDateTime(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  requestRide(ride: RideListItem): void {
    this.router.navigate(['/passenger/request-ride', ride.id]);
  }

  goToProfile(): void {
    this.router.navigate(['/passenger'], { queryParams: { tab: 'profile' } });
  }
}
