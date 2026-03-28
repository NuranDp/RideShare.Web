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
    loadComponent: () => import('./pages/login/login/login.component').then(m => m.LoginComponent),
    canActivate: [guestGuard]
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register/register.component').then(m => m.RegisterComponent),
    canActivate: [guestGuard]
  },
  // Rider routes with layout
  {
    path: 'rider',
    loadComponent: () => import('./layouts/rider-layout/rider-layout.component').then(m => m.RiderLayoutComponent),
    canActivate: [authGuard, riderGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/rider/rider-dashboard/rider-dashboard.component').then(m => m.RiderDashboardComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./pages/rider/rider-profile/rider-profile.component').then(m => m.RiderProfileComponent)
      },
      {
        path: 'post-ride',
        loadComponent: () => import('./pages/rider/post-ride/post-ride.component').then(m => m.PostRideComponent)
      },
      {
        path: 'my-rides',
        loadComponent: () => import('./pages/rider/my-rides/my-rides.component').then(m => m.MyRidesComponent)
      },
      {
        path: 'ride-requests/:id',
        loadComponent: () => import('./pages/rider/ride-requests-page/ride-requests-page.component').then(m => m.RideRequestsPageComponent)
      },
      {
        path: 'emergency-contact',
        loadComponent: () => import('./pages/shared/emergency-contact/emergency-contact.component').then(m => m.EmergencyContactComponent)
      },
      {
        path: 'ratings',
        loadComponent: () => import('./pages/rider/rider-ratings/rider-ratings.component').then(m => m.RiderRatingsComponent)
      },
      {
        path: 'nearby-requests',
        loadComponent: () => import('./pages/rider/nearby-requests/nearby-requests.component').then(m => m.NearbyRequestsComponent)
      },
      {
        path: 'active-ride/:id',
        loadComponent: () => import('./pages/rider/active-ride/active-ride.component').then(m => m.ActiveRideComponent)
      }
    ]
  },
  // Passenger routes with layout
  {
    path: 'passenger',
    loadComponent: () => import('./layouts/passenger-layout/passenger-layout.component').then(m => m.PassengerLayoutComponent),
    canActivate: [authGuard, passengerGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/passenger/passenger-dashboard/passenger-dashboard.component').then(m => m.PassengerDashboardComponent)
      },
      {
        path: 'browse-rides',
        loadComponent: () => import('./pages/passenger/browse-rides/browse-rides.component').then(m => m.BrowseRidesComponent)
      },
      {
        path: 'my-requests',
        loadComponent: () => import('./pages/passenger/my-requests/my-requests.component').then(m => m.MyRequestsComponent)
      },
      {
        path: 'request-ride/:id',
        loadComponent: () => import('./pages/passenger/request-ride/request-ride.component').then(m => m.RequestRideComponent)
      },
      {
        path: 'ride-history',
        loadComponent: () => import('./pages/passenger/ride-history/ride-history.component').then(m => m.RideHistoryComponent)
      },
      {
        path: 'track-ride/:id',
        loadComponent: () => import('./pages/passenger/track-ride/track-ride.component').then(m => m.TrackRideComponent)
      },
      {
        path: 'request-ondemand',
        loadComponent: () => import('./pages/passenger/request-ondemand/request-ondemand.component').then(m => m.RequestOnDemandComponent)
      },
      {
        path: 'emergency-contact',
        loadComponent: () => import('./pages/shared/emergency-contact/emergency-contact.component').then(m => m.EmergencyContactComponent)
      }
    ]
  },
  // Admin routes (no layout for now)
  {
    path: 'admin',
    loadComponent: () => import('./pages/admin/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
    canActivate: [authGuard, adminGuard]
  },
  {
    path: 'admin/license-review',
    loadComponent: () => import('./pages/admin/license-review/license-review.component').then(m => m.LicenseReviewComponent),
    canActivate: [authGuard, adminGuard]
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
