# RideShare Web - Angular Frontend

Angular 19 frontend for the RideShare motorcycle ride-sharing platform with PWA and Capacitor support for Android.

## Tech Stack

- **Angular 19** with standalone components
- **Angular Material** for UI components
- **Leaflet.js** for interactive maps
- **SignalR** for real-time notifications & tracking
- **RxJS** for reactive state management
- **PWA** with service worker for offline support
- **Capacitor 8** for native Android app

## Project Structure

```
src/app/
├── pages/
│   ├── admin/              # Admin dashboard, license review, reports, pricing
│   │   ├── admin-dashboard/
│   │   ├── license-review/
│   │   ├── manage-reports/
│   │   └── pricing-settings/
│   ├── rider/              # Post ride, my rides, profile
│   │   ├── active-ride/
│   │   ├── my-rides/
│   │   ├── nearby-requests/
│   │   ├── post-ride/
│   │   ├── ride-requests-dialog/
│   │   ├── ride-requests-page/
│   │   ├── rider-dashboard/
│   │   ├── rider-profile/
│   │   └── rider-ratings/
│   ├── passenger/          # Browse rides, track, requests
│   │   ├── browse-rides/
│   │   ├── my-requests/
│   │   ├── passenger-dashboard/
│   │   ├── request-ondemand/
│   │   ├── request-ride/
│   │   ├── request-ride-dialog/
│   │   ├── ride-history/
│   │   └── track-ride/
│   ├── shared/             # Shared pages
│   │   └── emergency-contact/
│   ├── login/
│   └── register/
├── components/
│   ├── confirm-dialog/     # Confirmation dialogs
│   ├── location-picker/    # Reusable map location selector
│   ├── notification-bell/  # Notification indicator
│   ├── notification-toast/ # Toast notifications
│   ├── ondemand-request-popup/ # On-demand request bottom sheet for riders
│   ├── rating-dialog/      # Rating submission
│   ├── report-dialog/      # User report submission dialog
│   ├── ride-accepted-dialog/ # Ride acceptance notification dialog
│   ├── ride-chat/          # In-ride messaging component
│   ├── ride-map/           # Ride list map view
│   ├── ride-request-popup/ # Bottom sheet for ride requests (multi-request nav, blurred bg)
│   ├── ride-status-dialog/ # Ride state change notifications
│   ├── route-preview/      # Route visualization
│   └── unified-route-map/  # Combined route & tracking map
├── layouts/
│   ├── passenger-layout/   # Passenger navigation layout
│   └── rider-layout/       # Rider navigation layout
├── services/
│   ├── admin.service.ts          # Admin operations
│   ├── auth.service.ts           # Authentication
│   ├── location-tracking.service.ts  # Live GPS tracking
│   ├── notification.service.ts   # SignalR notifications
│   ├── on-demand.service.ts     # On-demand ride requests
│   ├── report.service.ts        # User reports
│   ├── ride.service.ts           # Ride CRUD operations
│   ├── ride-chat.service.ts     # SignalR chat connection
│   ├── rider.service.ts          # Rider profile
│   └── theme.service.ts          # Dark/light mode
├── guards/                 # Route guards
├── interceptors/           # HTTP interceptors (JWT)
└── models/                 # TypeScript interfaces
```

## Development

### Prerequisites
- Node.js 18+
- Angular CLI (`npm install -g @angular/cli`)

### Install Dependencies
```bash
npm install
```

### Development Server
```bash
ng serve
```
Navigate to `http://localhost:4200/`. The app auto-reloads on file changes.

### Build for Production
```bash
ng build
```
Build artifacts are stored in the `dist/` directory.

## PWA Features

The app includes full PWA support:
- **Service Worker**: Caches app shell for offline access
- **Web App Manifest**: Installable to home screen
- **Theme Color**: Custom status bar color (#034694)
- **Icons**: Multiple sizes for all devices

### Install as PWA
On mobile Chrome: Menu → "Add to Home Screen"

## Android App (Capacitor)

### Build Android
```bash
npm run build
npx cap sync android
npx cap open android
```

### Run on Device
```bash
npx cap run android
```

### Capacitor Plugins
- `@capacitor/geolocation` - Native GPS
- `@capacitor/push-notifications` - FCM
- `@capacitor/camera` - Photo capture
- `@capacitor/preferences` - Local storage
- `@capacitor/splash-screen` - Splash screen
- `@capacitor/app` - Lifecycle & back button

## Key Features

### Maps Integration (Leaflet.js)
- **Location Picker**: Search, GPS, or click-to-select locations
- **Ride Map View**: Visual route display with markers
- **Live Tracking**: Real-time rider position updates

### Real-Time (SignalR)
- Request notifications
- Status change alerts
- Live location streaming

### Components
- Fully standalone Angular 19 components
- Material Design theming
- Responsive layouts
- Dark/Light mode support (user-specific, synced via API)

## Configuration

API URL is configured in `src/environments/`:
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000/api'
};
```
