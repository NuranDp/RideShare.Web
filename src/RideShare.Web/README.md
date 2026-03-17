# RideShare Web - Angular Frontend

Angular 19 frontend for the RideShare motorcycle ride-sharing platform.

## Tech Stack

- **Angular 19** with standalone components
- **Angular Material** for UI components
- **Leaflet.js** for interactive maps
- **SignalR** for real-time notifications & tracking
- **RxJS** for reactive state management

## Project Structure

```
src/app/
├── pages/
│   ├── admin/              # Admin dashboard, license review
│   ├── rider/              # Post ride, my rides, profile
│   ├── passenger/          # Browse rides, track, requests
│   ├── login/
│   └── register/
├── components/
│   ├── location-picker/    # Reusable map location selector
│   ├── ride-map/           # Ride list map view
│   ├── route-preview/      # Route visualization
│   ├── unified-route-map/  # Combined route & tracking map
│   ├── rating-dialog/      # Rating submission
│   ├── notification-bell/  # Notification indicator
│   └── notification-toast/ # Toast notifications
├── services/
│   ├── auth.service.ts           # Authentication
│   ├── ride.service.ts           # Ride CRUD operations
│   ├── rider.service.ts          # Rider profile
│   ├── admin.service.ts          # Admin operations
│   ├── notification.service.ts   # SignalR notifications
│   └── location-tracking.service.ts  # Live GPS tracking
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

## Configuration

API URL is configured in `src/environments/`:
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000/api'
};
```
