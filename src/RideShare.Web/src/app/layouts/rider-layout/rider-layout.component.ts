import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { NotificationBellComponent } from '../../components/notification-bell/notification-bell.component';
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
    NotificationBellComponent
  ],
  templateUrl: './rider-layout.component.html',
  styleUrls: ['./rider-layout.component.scss']
})
export class RiderLayoutComponent implements OnInit, OnDestroy {
  isProfileActive = false;
  isHomeActive = false;
  pageTitle = '';
  private subscription = new Subscription();

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.checkActiveState();
    
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
    
    return '';
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
