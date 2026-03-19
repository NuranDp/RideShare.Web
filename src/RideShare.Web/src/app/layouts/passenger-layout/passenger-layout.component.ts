import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet, ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { NotificationBellComponent } from '../../components/notification-bell/notification-bell.component';
import { ThemeService } from '../../services/theme.service';
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
    NotificationBellComponent
  ],
  templateUrl: './passenger-layout.component.html',
  styleUrls: ['./passenger-layout.component.scss']
})
export class PassengerLayoutComponent implements OnInit, OnDestroy {
  isProfileActive = false;
  isHomeActive = false;
  pageTitle = '';
  private subscription = new Subscription();

  constructor(private route: ActivatedRoute, private router: Router, public themeService: ThemeService) {}

  ngOnInit(): void {
    // Check initial state
    this.checkActiveState();
    
    // Listen for navigation changes
    this.subscription.add(
      this.router.events.pipe(
        filter(event => event instanceof NavigationEnd)
      ).subscribe(() => {
        this.checkActiveState();
      })
    );
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

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
