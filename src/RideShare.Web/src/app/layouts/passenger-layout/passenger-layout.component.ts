import { Component, OnInit, OnDestroy, HostListener, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet, ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { NotificationBellComponent } from '../../components/notification-bell/notification-bell.component';
import { NotificationService, Notification } from '../../services/notification.service';
import { RideAcceptedDialogComponent, RideAcceptedDialogData } from '../../components/ride-accepted-dialog/ride-accepted-dialog.component';
import { RideStatusDialogComponent, RideStatusDialogData } from '../../components/ride-status-dialog/ride-status-dialog.component';
import { ThemeService } from '../../services/theme.service';
import { RideService } from '../../services/ride.service';
import { Subscription, filter } from 'rxjs';

@Component({
  selector: 'app-passenger-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatIconModule,
    MatDialogModule,
    NotificationBellComponent
  ],
  templateUrl: './passenger-layout.component.html',
  styleUrls: ['./passenger-layout.component.scss']
})
export class PassengerLayoutComponent implements OnInit, OnDestroy {
  @ViewChild('activeRideCard') activeRideCard?: ElementRef<HTMLDivElement>;

  isProfileActive = false;
  isHomeActive = false;
  pageTitle = '';
  activeRide: any | null = null;
  dragOffsetX = 0;
  dragOffsetY = 0;
  dragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private cardStartX = 0;
  private cardStartY = 0;
  private pointerId: number | null = null;
  private movedDuringDrag = false;
  private subscription = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dialog: MatDialog,
    private rideService: RideService,
    private notificationService: NotificationService,
    public themeService: ThemeService
  ) {}

  ngOnInit(): void {
    // Check initial state
    this.checkActiveState();
    this.loadActiveRide();
    
    // Listen for navigation changes
    this.subscription.add(
      this.router.events.pipe(
        filter(event => event instanceof NavigationEnd)
      ).subscribe(() => {
        this.checkActiveState();
        this.loadActiveRide();
      })
    );

    // Listen for ride-related notifications and show appropriate dialogs
    this.subscription.add(
      this.notificationService.onRideNotification$.subscribe(notification => {
        this.handleRideNotification(notification);
        this.loadActiveRide();
      })
    );
  }

  private loadActiveRide(): void {
    this.rideService.getMyRequests().subscribe({
      next: (requests) => {
        this.activeRide = requests.find(r => r.status === 'Accepted' && r.rideStatus === 'InProgress') || null;
      },
      error: () => {}
    });
  }

  getShortAddress(fullAddress: string): string {
    if (!fullAddress) return 'Unknown';
    const first = fullAddress.split(/[,،]/)[0]?.trim() || fullAddress;
    return first.length > 20 ? first.substring(0, 20) + '...' : first;
  }

  goToActiveRide(): void {
    if (!this.activeRide?.rideId) return;
    this.router.navigate(['/passenger/track-ride', this.activeRide.rideId]);
  }

  onCardPointerDown(event: PointerEvent): void {
    const target = event.target as HTMLElement;
    if (target.closest('button')) return;

    // Start dragging for touch/mouse/pen pointers.
    this.dragging = true;
    this.movedDuringDrag = false;
    this.pointerId = event.pointerId;
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;
    this.cardStartX = this.dragOffsetX;
    this.cardStartY = this.dragOffsetY;

    const card = this.activeRideCard?.nativeElement;
    if (card) card.setPointerCapture(event.pointerId);
    event.preventDefault();
  }

  @HostListener('window:pointermove', ['$event'])
  onWindowPointerMove(event: PointerEvent): void {
    if (!this.dragging) return;
    if (this.pointerId !== null && event.pointerId !== this.pointerId) return;

    const deltaX = event.clientX - this.dragStartX;
    const deltaY = event.clientY - this.dragStartY;

    if (!this.movedDuringDrag && (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4)) {
      this.movedDuringDrag = true;
    }

    const xBounds = this.getDragXBounds();
    this.dragOffsetX = Math.max(xBounds.min, Math.min(xBounds.max, this.cardStartX + deltaX));
    this.dragOffsetY = Math.max(-260, Math.min(60, this.cardStartY + deltaY));
  }

  @HostListener('window:pointerup', ['$event'])
  @HostListener('window:pointercancel', ['$event'])
  onWindowPointerUp(event: PointerEvent): void {
    if (this.pointerId !== null && event.pointerId !== this.pointerId) return;
    if (this.dragging && this.movedDuringDrag) {
      this.snapToEdge();
    }
    this.dragging = false;
    this.pointerId = null;
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    const xBounds = this.getDragXBounds();
    this.dragOffsetX = Math.max(xBounds.min, Math.min(xBounds.max, this.dragOffsetX));
    this.dragOffsetY = Math.max(-260, Math.min(60, this.dragOffsetY));
  }

  resetCardPosition(): void {
    this.dragOffsetX = 0;
    this.dragOffsetY = 0;
  }

  private getDragXBounds(): { min: number; max: number } {
    const viewportWidth = window.innerWidth;
    const cardWidth = this.activeRideCard?.nativeElement.offsetWidth || Math.min(420, viewportWidth - 24);
    const margin = 12;
    const min = 0;
    const max = Math.max(0, viewportWidth - margin - cardWidth - margin);
    return { min, max };
  }

  private snapToEdge(): void {
    const bounds = this.getDragXBounds();
    const midpoint = (bounds.min + bounds.max) / 2;
    this.dragOffsetX = this.dragOffsetX < midpoint ? bounds.min : bounds.max;
  }

  private checkActiveState(): void {
    const url = this.router.url;
    this.isProfileActive = url.includes('tab=profile');
    // Home is active when on /passenger without profile tab, or with home tab
    this.isHomeActive = (url.startsWith('/passenger') && !url.includes('/passenger/') && !this.isProfileActive);
    this.pageTitle = this.getPageTitle(url);
  }

  private getPageTitle(url: string): string {
    if (this.isHomeActive) return '';
    if (this.isProfileActive) return 'Profile';
    
    if (url.includes('/passenger/browse-rides')) return 'Find Rides';
    if (url.includes('/passenger/my-requests')) return 'My Requests';
    if (url.includes('/passenger/request-ride')) return 'Request Ride';
    if (url.includes('/passenger/ride-history')) return 'Ride History';
    if (url.includes('/passenger/track-ride')) return 'Track Ride';
    if (url.includes('/passenger/emergency-contact')) return 'Emergency Contact';
    
    return '';
  }

  private handleRideNotification(notification: Notification): void {
    const data = notification.data || {};
    const rideId = data['rideId'] as string;
    const riderName = data['riderName'] as string || '';
    const origin = data['origin'] as string || '';
    const destination = data['destination'] as string || '';

    switch (notification.type) {
      case 'request_accepted': {
        const dialogRef = this.dialog.open(RideAcceptedDialogComponent, {
          width: '420px',
          maxWidth: '95vw',
          disableClose: true,
          panelClass: 'ride-notification-dialog',
          data: {
            rideId,
            riderName,
            riderPhone: data['riderPhone'] as string || '',
            origin,
            destination,
            originLat: data['originLat'] as number || 0,
            originLng: data['originLng'] as number || 0,
            destLat: data['destLat'] as number || 0,
            destLng: data['destLng'] as number || 0,
            vehicleModel: data['vehicleModel'] as string || '',
            plateNumber: data['plateNumber'] as string || ''
          } as RideAcceptedDialogData
        });

        dialogRef.afterClosed().subscribe(result => {
          if (result === 'view') {
            this.router.navigate(['/passenger/my-requests']);
          }
        });
        break;
      }

      case 'ride_started': {
        const dialogRef = this.dialog.open(RideStatusDialogComponent, {
          width: '420px',
          maxWidth: '95vw',
          disableClose: true,
          panelClass: 'ride-notification-dialog',
          data: { type: 'started', rideId, riderName, origin, destination } as RideStatusDialogData
        });

        dialogRef.afterClosed().subscribe(result => {
          if (result === 'started') {
            this.router.navigate(['/passenger/track-ride', rideId]);
          }
        });
        break;
      }

      case 'ride_completed': {
        // Immediately clear the floating bar — no API roundtrip needed
        this.activeRide = null;

        const dialogRef = this.dialog.open(RideStatusDialogComponent, {
          width: '420px',
          maxWidth: '95vw',
          panelClass: 'ride-notification-dialog',
          data: {
            type: 'completed',
            rideId,
            riderName,
            origin,
            destination,
            startedAt: data['startedAt'] as string || undefined,
            completedAt: data['completedAt'] as string || undefined,
            vehicleModel: data['vehicleModel'] as string || undefined,
            plateNumber: data['plateNumber'] as string || undefined
          } as RideStatusDialogData
        });

        dialogRef.afterClosed().subscribe(result => {
          if (result === 'completed') {
            this.router.navigate(['/passenger/my-requests']);
          }
        });
        break;
      }

      case 'ride_cancelled': {
        this.dialog.open(RideStatusDialogComponent, {
          width: '420px',
          maxWidth: '95vw',
          panelClass: 'ride-notification-dialog',
          data: { type: 'cancelled', rideId, riderName, origin, destination } as RideStatusDialogData
        });
        break;
      }

      case 'rider_arrived': {
        const pickupLocation = data['pickupLocation'] as string || origin;
        const dialogRef = this.dialog.open(RideStatusDialogComponent, {
          width: '420px',
          maxWidth: '95vw',
          disableClose: true,
          panelClass: 'ride-notification-dialog',
          data: { type: 'arrived', rideId, riderName, origin: pickupLocation, destination } as RideStatusDialogData
        });

        dialogRef.afterClosed().subscribe(result => {
          if (result === 'arrived') {
            this.router.navigate(['/passenger/track-ride', rideId]);
          }
        });
        break;
      }
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
