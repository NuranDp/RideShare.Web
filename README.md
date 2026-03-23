# RideShare - Motorcycle Ride Sharing Platform

A motorcycle-based ride-sharing platform where riders post their commute routes and passengers can browse and request to join. Unlike traditional ride-hailing apps, riders announce where they're going and passengers hop on.

> **Note**: This version is limited to motorcycles only (1 passenger per ride).

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Angular 19 (Standalone Components), Angular Material |
| **Backend** | .NET 9 Web API, Entity Framework Core |
| **Database** | Supabase (PostgreSQL) |
| **Authentication** | JWT Tokens |
| **Maps** | Leaflet.js with OpenStreetMap tiles |
| **Geocoding** | Nominatim API for address search & reverse geocoding |
| **Real-Time** | SignalR for live notifications & location tracking |
| **Mobile** | PWA + Capacitor (Android) |

## Features

### Core Features
- **User Authentication**: JWT-based auth with role selection (Rider/Passenger)
- **Role-Based Access Control**: Rider, Passenger, and Admin roles
- **Profile Management**: Emergency contact info, profile photos
- **Dark/Light Mode**: User-specific theme preference synced across devices

### Rider Features
- **License Verification**: Submit license for admin approval
- **Verified Badge**: Displayed once approved
- **Ride Posting**: Create rides with interactive map location selection
- **Request Management**: Accept/reject passenger requests
- **Live Location Sharing**: Share real-time location during active rides

### Passenger Features
- **Browse Rides**: List view and interactive map view
- **Search & Filter**: By destination, time, origin area
- **Pickup/Drop-off Selection**: Interactive step-by-step map UI
- **Live Tracking**: Track rider's location in real-time during ride
- **Rating System**: Rate riders after completing trips

### Admin Features
- **License Review**: Approve/reject rider license submissions
- **Platform Oversight**: Monitor platform activity

### Trust System
- **Trust Score** calculated from:
  - ✓ License verification status
  - ✓ Total completed rides
  - ✓ Average rating from passengers

### Real-Time Features (SignalR)
- **Instant Notifications**: Ride requests, status changes, acceptances
- **Live Location Tracking**: GPS updates every 5 seconds during rides
- **ETA Calculations**: Estimated arrival time for passengers

### PWA & Mobile Support
- **Progressive Web App**: Install from browser to home screen
- **Offline Caching**: Service worker for offline app shell
- **Capacitor Android**: Native Android app wrapper
- **Push Notifications**: FCM token support for native push
- **Native Plugins**: Geolocation, Camera, Splash Screen

## Project Structure

```
ride-share/
├── src/
│   ├── RideShare.Api/          # .NET 9 Web API
│   │   ├── Controllers/        # API endpoints
│   │   ├── Services/           # Business logic
│   │   ├── DTOs/               # Data transfer objects
│   │   ├── Hubs/               # SignalR hubs
│   │   ├── Data/               # DbContext
│   │   └── Configuration/      # JWT settings
│   │
│   ├── RideShare.Core/         # Shared domain entities
│   │   └── Entities/           # User, Ride, RiderProfile, etc.
│   │
│   └── RideShare.Web/          # Angular 19 frontend
│       ├── android/            # Capacitor Android project
│       └── src/app/
│           ├── pages/          # Feature modules
│           │   ├── admin/      # License review, dashboard
│           │   │   ├── admin-dashboard/
│           │   │   └── license-review/
│           │   ├── rider/      # Post ride, my rides, profile
│           │   │   ├── my-rides/
│           │   │   ├── post-ride/
│           │   │   ├── ride-requests-dialog/
│           │   │   ├── ride-requests-page/
│           │   │   ├── rider-dashboard/
│           │   │   ├── rider-profile/
│           │   │   └── rider-ratings/
│           │   ├── passenger/  # Browse, track, requests
│           │   │   ├── browse-rides/
│           │   │   ├── my-requests/
│           │   │   ├── passenger-dashboard/
│           │   │   ├── request-ride/
│           │   │   ├── request-ride-dialog/
│           │   │   ├── ride-history/
│           │   │   └── track-ride/
│           │   ├── shared/     # Shared pages
│           │   │   └── emergency-contact/
│           │   ├── login/
│           │   └── register/
│           ├── components/     # Shared components
│           │   ├── confirm-dialog/
│           │   ├── location-picker/
│           │   ├── notification-bell/
│           │   ├── notification-toast/
│           │   ├── rating-dialog/
│           │   ├── ride-map/
│           │   ├── route-preview/
│           │   └── unified-route-map/
│           ├── layouts/        # Layout components
│           │   ├── passenger-layout/
│           │   └── rider-layout/
│           └── services/       # API services
│               ├── admin.service.ts
│               ├── auth.service.ts
│               ├── location-tracking.service.ts
│               ├── notification.service.ts
│               ├── ride.service.ts
│               ├── rider.service.ts
│               └── theme.service.ts
│
├── database/
│   ├── migrations/             # SQL migration scripts
│   └── seed/                   # Sample data
├── docs/                       # Documentation & plans
└── RideShare.sln               # .NET solution file
```

## Getting Started

### Prerequisites

- .NET 9 SDK
- Node.js 18+
- Supabase account (free tier available at https://supabase.com)
- Angular CLI (`npm install -g @angular/cli`)

### Backend Setup

1. Navigate to the API project:
   ```bash
   cd src/RideShare.Api
   ```

2. Update the connection string in `appsettings.json` with your Supabase credentials:
   ```json
   "ConnectionStrings": {
     "DefaultConnection": "Host=aws-1-[REGION].pooler.supabase.com;Port=5432;Database=postgres;Username=postgres.[PROJECT-REF];Password=[YOUR-PASSWORD];SSL Mode=Require;Trust Server Certificate=true"
   }
   ```
   > Get this from Supabase Dashboard → Project Settings → Database → Connection string (Session pooler)

3. Apply database migrations:
   ```bash
   dotnet ef database update
   ```

4. Run the API:
   ```bash
   dotnet run
   ```

The API will be available at `http://localhost:5000`

### Frontend Setup

1. Navigate to the Angular project:
   ```bash
   cd src/RideShare.Web
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   ng serve
   ```

The app will be available at `http://localhost:4200`

## Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@rideshare.com | Admin@123 |

## Workflow

### 🏍️ For Riders
1. **Register** as a "Rider"
2. **Complete Profile** → Rider Profile → Enter license number, motorcycle model, plate number
3. **Wait for Verification** → Admin reviews and approves your license
4. **Post Rides** → Create rides with interactive map location selection
5. **Manage Requests** → View incoming requests in My Rides
   - See passenger's pickup & drop-off points on the map
   - Accept or reject each request
6. **Start Ride** → Begin live location sharing with passenger
7. **Complete Ride** → Mark ride as finished

### 🚶 For Passengers
1. **Register** as a "Passenger"
2. **Browse Rides** → Find a Ride (toggle between list and map view)
3. **View Details** → Check ride info and rider's trust score
4. **Request to Join** → Interactive pickup/drop-off selection:
   - Map shows rider's route (origin → destination)
   - Click to set your **pickup point** (green "P" marker)
   - Click to set your **drop-off point** (red "D" marker)
   - Drag markers to fine-tune positions
   - Add optional message to rider
5. **Track Requests** → Monitor status in My Requests
6. **Track Ride** → Once accepted, watch rider's live location during the trip
7. **Rate Rider** → Submit rating after ride completion

### 👨‍💼 For Admins
1. **Login** with admin credentials
2. **Review Licenses** → Approve or reject pending rider verifications
3. **Monitor Activity** → View platform statistics

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user (Rider/Passenger) |
| POST | `/api/auth/login` | Login and get JWT token |
| GET | `/api/auth/me` | Get current user profile |
| PUT | `/api/auth/profile` | Update profile |
| PUT | `/api/auth/emergency-contact` | Update emergency contact |
| PUT | `/api/auth/theme` | Update theme preference (dark/light) |
| PUT | `/api/auth/fcm-token` | Save FCM token for push notifications |

### Rider Profile
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/rider/profile` | Get my rider profile |
| PUT | `/api/rider/profile` | Update motorcycle info & submit license |
| GET | `/api/rider/{id}/public` | Get public rider profile |

### Rides
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/rides` | List available rides (filterable) |
| GET | `/api/rides/{id}` | Get ride details |
| POST | `/api/rides` | Create new ride (verified riders) |
| PUT | `/api/rides/{id}` | Update ride |
| PUT | `/api/rides/{id}/cancel` | Cancel ride |
| PUT | `/api/rides/{id}/start` | Start ride (enables tracking) |
| PUT | `/api/rides/{id}/complete` | Complete ride |
| GET | `/api/rides/my-rides` | Get my posted rides |
| GET | `/api/rides/popular-routes` | Get popular routes |

### Ride Requests
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/rides/{id}/request` | Request to join ride |
| GET | `/api/rides/{id}/requests` | Get requests for a ride |
| PUT | `/api/rides/requests/{id}/accept` | Accept request |
| PUT | `/api/rides/requests/{id}/reject` | Reject request |
| PUT | `/api/rides/requests/{id}/cancel` | Cancel request |
| GET | `/api/rides/my-requests` | Get my requests (Passenger) |

### Ratings
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/rides/{id}/rate` | Rate a completed ride |
| GET | `/api/rider/{id}/ratings` | Get rider's ratings |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/pending-verifications` | Get pending licenses |
| PUT | `/api/admin/verify-license/{userId}` | Approve license |
| PUT | `/api/admin/reject-license/{userId}` | Reject license |
| GET | `/api/admin/stats` | Get platform statistics |

### SignalR Hubs
| Hub | Purpose |
|-----|---------|
| `/hubs/notifications` | Real-time notifications |
| `/hubs/location` | Live ride tracking |

## Map Features

### Location Picker Component
- 🔍 Search autocomplete (Nominatim API)
- 📍 "Use Current Location" (GPS)
- 🖱️ Click-to-select on map
- 🟢 Green marker for origin/pickup
- 🔴 Red marker for destination/drop-off

### Ride Map View
- Shows all available rides with route lines
- Dashed lines connecting origin → destination
- Click markers to view ride details
- Passenger pickup/drop-off visualization

### Live Tracking
- Real-time rider position updates (5s interval)
- Moving marker animation
- ETA calculations
- Route visualization

## Deployment (Render)

This project is configured for deployment on [Render](https://render.com) using Docker.

### Deploy via Render Blueprint

1. Push your code to GitHub
2. Go to [Render Dashboard](https://dashboard.render.com)
3. Click "New" → "Blueprint"
4. Connect your GitHub repository
5. Render will detect the `render.yaml` and create both services

### Manual Deployment

#### Deploy API

1. Go to Render Dashboard → "New" → "Web Service"
2. Connect your GitHub repository
3. Configure:
   - **Name**: `rideshare-api`
   - **Runtime**: Docker
   - **Dockerfile Path**: `./src/RideShare.Api/Dockerfile`
   - **Docker Context**: `./src`
4. Add environment variables:
   - `ConnectionStrings__DefaultConnection`: Your Supabase connection string
   - `JwtSettings__SecretKey`: A secure random string (32+ characters)
   - `JwtSettings__Issuer`: `RideShareApi`
   - `JwtSettings__Audience`: `RideShareApp`
   - `JwtSettings__ExpiryInDays`: `7`
5. Deploy

#### Deploy Frontend

1. Go to Render Dashboard → "New" → "Web Service"
2. Connect your GitHub repository
3. Configure:
   - **Name**: `rideshare-web`
   - **Runtime**: Docker
   - **Dockerfile Path**: `./src/RideShare.Web/Dockerfile`
   - **Docker Context**: `./src/RideShare.Web`
4. Deploy

### Post-Deployment

After deployment, update the URLs:

1. **Update Frontend API URL**: Edit `src/RideShare.Web/src/environments/environment.prod.ts`:
   ```typescript
   apiUrl: 'https://your-api-name.onrender.com/api'
   ```

2. **Update CORS in API**: Edit `src/RideShare.Api/Program.cs` to add your frontend URL:
   ```csharp
   policy.WithOrigins(
       "http://localhost:4200",
       "https://your-frontend-name.onrender.com"
   )
   ```

3. Commit and push changes - Render will auto-deploy

### Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `ConnectionStrings__DefaultConnection` | Supabase PostgreSQL connection string | Yes |
| `JwtSettings__SecretKey` | Secret key for JWT signing (min 32 chars) | Yes |
| `JwtSettings__Issuer` | JWT issuer name | Yes |
| `JwtSettings__Audience` | JWT audience | Yes |
| `JwtSettings__ExpiryInDays` | Token expiration in days | Yes |
| `ASPNETCORE_ENVIRONMENT` | Set to `Production` | Auto-set |

## Mobile App (Android)

### PWA Installation
Users can install the app directly from the browser:
1. Open the app URL in Chrome on mobile
2. Tap the browser menu → "Add to Home Screen"
3. The app will work offline and feel like a native app

### Build Android APK (requires Android SDK)

1. Build the Angular app:
   ```bash
   cd src/RideShare.Web
   npm run build
   ```

2. Sync with Capacitor:
   ```bash
   npx cap sync android
   ```

3. Open in Android Studio:
   ```bash
   npx cap open android
   ```

4. Build APK from Android Studio or command line:
   ```bash
   cd android
   ./gradlew assembleDebug
   ```

The APK will be at: `android/app/build/outputs/apk/debug/app-debug.apk`

### Capacitor Plugins Included
- `@capacitor/geolocation` - Native GPS
- `@capacitor/push-notifications` - FCM push notifications
- `@capacitor/camera` - Photo capture
- `@capacitor/preferences` - Local storage
- `@capacitor/splash-screen` - Native splash screen
- `@capacitor/app` - App lifecycle & back button

## License

MIT
