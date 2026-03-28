import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { NotificationBellComponent } from '../../components/notification-bell/notification-bell.component';
import { RideRequestPopupComponent } from '../../components/ride-request-popup/ride-request-popup.component';
import { OndemandRequestPopupComponent } from '../../components/ondemand-request-popup/ondemand-request-popup.component';
import { ThemeService } from '../../services/theme.service';
import { RideService } from '../../services/ride.service';
import { Ride } from '../../models/ride.model';
import { Subscription, filter } from 'rxjs';

@Component({
  selector: 'app-rider-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatIconModule,
    MatSnackBarModule,
    NotificationBellComponent,
    RideRequestPopupComponent,
    OndemandRequestPopupComponent
  ],
  templateUrl: './rider-layout.component.html',
  styleUrls: ['./rider-layout.component.scss']
})
export class RiderLayoutComponent implements OnInit, OnDestroy {
  isProfileActive = false;
  isHomeActive = false;
  isActiveRidePage = false;
  pageTitle = '';
  activeRide: Ride | null = null;
  private subscription = new Subscription();

  constructor(
    private router: Router,
    private rideService: RideService,
    public themeService: ThemeService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.checkActiveState();
    this.loadActiveRide();
    
    this.subscription.add(
      this.router.events.pipe(
        filter(event => event instanceof NavigationEnd)
      ).subscribe(() => {
        this.checkActiveState();
        this.loadActiveRide();
      })
    );
  }

  private loadActiveRide(): void {
    this.rideService.getMyPostedRides().subscribe({
      next: (rides) => {
        const inProgress = rides.find(r => r.status === 'InProgress');
        const booked = rides.find(r => r.status === 'Booked');
        this.activeRide = inProgress || booked || null;
      },
      error: () => {
        this.activeRide = null;
      }
    });
  }

  goToActiveRide(): void {
    if (this.activeRide?.id) {
      this.router.navigate(['/rider/active-ride', this.activeRide.id]);
      return;
    }
    this.router.navigate(['/rider/my-rides']);
  }

  onOngoingClick(event: Event): void {
    if (this.activeRide?.id) {
      this.router.navigate(['/rider/active-ride', this.activeRide.id]);
    } else {
      event.preventDefault();
      this.snackBar.open('No ongoing ride at the moment', 'OK', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
        panelClass: ['snack-no-ride']
      });
    }
  }

  private checkActiveState(): void {
    const url = this.router.url;
    this.isProfileActive = url.includes('tab=profile');
    this.isActiveRidePage = url.includes('/rider/active-ride/');
    this.isHomeActive = (url.startsWith('/rider') && !url.includes('/rider/') && !this.isProfileActive);
    this.pageTitle = this.getPageTitle(url);
  }

  private getPageTitle(url: string): string {
    if (this.isHomeActive) return '';
    if (this.isProfileActive) return 'Profile';
    
    if (url.includes('/rider/post-ride')) return 'Post Ride';
    if (url.includes('/rider/my-rides')) return 'My Rides';
    if (url.includes('/rider/profile')) return 'Rider Profile';
    if (url.includes('/rider/emergency-contact')) return 'Emergency Contact';
    if (url.includes('/rider/ratings')) return 'My Ratings';
    if (url.includes('/rider/ride-requests')) return 'Ride Requests';
    if (url.includes('/rider/active-ride')) return 'Active Ride';
    
    return '';
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
