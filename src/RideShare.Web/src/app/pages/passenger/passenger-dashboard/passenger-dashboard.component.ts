import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';
import { MatBadgeModule } from '@angular/material/badge';
import { AuthService } from '../../../services/auth.service';
import { RideService } from '../../../services/ride.service';
import { ThemeService } from '../../../services/theme.service';

@Component({
  selector: 'app-passenger-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatRippleModule,
    MatBadgeModule
  ],
  templateUrl: './passenger-dashboard.component.html',
  styleUrls: ['./passenger-dashboard.component.scss']
})
export class PassengerDashboardComponent implements OnInit {
  activeTab: 'home' | 'activity' | 'profile' = 'home';
  
  // Stats
  totalRides = 0;
  pendingCount = 0;
  acceptedCount = 0;
  emergencyContact = '';
  
  // Data
  upcomingRides: any[] = [];
  activities: any[] = [];

  constructor(
    public authService: AuthService,
    private rideService: RideService,
    public themeService: ThemeService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['tab'] === 'profile') {
        this.activeTab = 'profile';
      } else if (params['tab'] === 'home') {
        this.activeTab = 'home';
      }
    });
    this.loadRequests();
    this.loadActivities();
  }

  getFirstName(): string {
    const fullName = this.authService.currentUser()?.fullName || '';
    return fullName.split(' ')[0];
  }

  loadRequests(): void {
    this.rideService.getMyRequests().subscribe({
      next: (requests) => {
        this.pendingCount = requests.filter(r => r.status === 'Pending').length;
        this.acceptedCount = requests.filter(r => r.status === 'Accepted').length;
        this.totalRides = requests.filter(r => r.status === 'Accepted' && r.rideStatus === 'Completed').length;
        
        // Get upcoming rides (accepted requests)
        this.upcomingRides = requests
          .filter(r => r.status === 'Accepted' && (r.rideStatus === 'Booked' || r.rideStatus === 'InProgress'))
          .slice(0, 3);
      },
      error: () => {}
    });
  }

  loadActivities(): void {
    // Mock activities - in real app, this would come from an API
    this.activities = [];
  }

  getShortAddress(fullAddress: string): string {
    if (!fullAddress) return 'Not specified';
    const parts = fullAddress.split(/[,،]/);
    let shortAddr = parts[0].trim();
    return shortAddr.length > 18 ? shortAddr.substring(0, 18) + '...' : shortAddr;
  }

  formatDateTime(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getActivityIcon(type: string): string {
    switch (type) {
      case 'request': return 'send';
      case 'accepted': return 'check_circle';
      case 'rejected': return 'cancel';
      case 'completed': return 'flag';
      default: return 'notifications';
    }
  }

  logout(): void {
    this.authService.logout();
  }
}
