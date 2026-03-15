import { Routes } from '@angular/router';
import { authGuard, guestGuard, riderGuard, passengerGuard, adminGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent),
    canActivate: [guestGuard]
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register.component').then(m => m.RegisterComponent),
    canActivate: [guestGuard]
  },
  {
    path: 'rider',
    loadComponent: () => import('./pages/rider/rider-dashboard.component').then(m => m.RiderDashboardComponent),
    canActivate: [authGuard, riderGuard]
  },
  {
    path: 'rider/profile',
    loadComponent: () => import('./pages/rider/rider-profile.component').then(m => m.RiderProfileComponent),
    canActivate: [authGuard, riderGuard]
  },
  {
    path: 'rider/post-ride',
    loadComponent: () => import('./pages/rider/post-ride.component').then(m => m.PostRideComponent),
    canActivate: [authGuard, riderGuard]
  },
  {
    path: 'rider/my-rides',
    loadComponent: () => import('./pages/rider/my-rides.component').then(m => m.MyRidesComponent),
    canActivate: [authGuard, riderGuard]
  },
  {
    path: 'rider/ride-requests/:id',
    loadComponent: () => import('./pages/rider/ride-requests-page.component').then(m => m.RideRequestsPageComponent),
    canActivate: [authGuard, riderGuard]
  },
  {
    path: 'passenger',
    loadComponent: () => import('./pages/passenger/passenger-dashboard.component').then(m => m.PassengerDashboardComponent),
    canActivate: [authGuard, passengerGuard]
  },
  {
    path: 'passenger/browse-rides',
    loadComponent: () => import('./pages/passenger/browse-rides.component').then(m => m.BrowseRidesComponent),
    canActivate: [authGuard, passengerGuard]
  },
  {
    path: 'passenger/my-requests',
    loadComponent: () => import('./pages/passenger/my-requests.component').then(m => m.MyRequestsComponent),
    canActivate: [authGuard, passengerGuard]
  },
  {
    path: 'passenger/request-ride/:id',
    loadComponent: () => import('./pages/passenger/request-ride.component').then(m => m.RequestRideComponent),
    canActivate: [authGuard, passengerGuard]
  },
  {
    path: 'passenger/ride-history',
    loadComponent: () => import('./pages/passenger/ride-history.component').then(m => m.RideHistoryComponent),
    canActivate: [authGuard, passengerGuard]
  },
  {
    path: 'passenger/track-ride/:id',
    loadComponent: () => import('./pages/passenger/track-ride.component').then(m => m.TrackRideComponent),
    canActivate: [authGuard, passengerGuard]
  },
  {
    path: 'admin',
    loadComponent: () => import('./pages/admin/admin-dashboard.component').then(m => m.AdminDashboardComponent),
    canActivate: [authGuard, adminGuard]
  },
  {
    path: 'admin/license-review',
    loadComponent: () => import('./pages/admin/license-review.component').then(m => m.LicenseReviewComponent),
    canActivate: [authGuard, adminGuard]
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
