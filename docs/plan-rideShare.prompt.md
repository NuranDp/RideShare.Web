# Ride Sharing App - Implementation Plan

## Overview

A **motorcycle-based** ride-sharing platform where **riders post their commute routes/times** and **passengers can browse and request to join**. Unlike Uber where passengers request rides, here riders announce where they're going and passengers hop on.

> **Note**: This version is limited to motorcycles only (1 passenger per ride).

---

## Actors & Use Cases

### Actor 1: Rider (Driver)
A registered user who has a vehicle and offers rides to passengers.

| Use Case | Description |
|----------|-------------|
| UC-R1: Register/Login | Create account, login with credentials |
| UC-R2: Manage Profile | Update name, phone, photo, emergency contact |
| UC-R3: Submit License | Upload driving license for verification |
| UC-R4: Post Ride | Create a ride with origin, destination, time |
| UC-R5: Edit/Cancel Ride | Modify or cancel a posted ride |
| UC-R6: View Ride Requests | See passengers who requested to join |
| UC-R7: Accept/Reject Request | Approve or decline passenger requests |
| UC-R8: View My Posted Rides | Dashboard of all rides I've posted |
| UC-R9: Mark Ride Complete | Mark a ride as completed after trip |
| UC-R10: View Ride History | See past completed/cancelled rides |
| UC-R11: View Nearby On-Demand Requests | See on-demand requests from nearby passengers |
| UC-R12: Accept On-Demand Request | Accept a nearby passenger's instant request |

### Actor 2: Passenger
A registered user looking to find and join available rides.

| Use Case | Description |
|----------|-------------|
| UC-P1: Register/Login | Create account, login with credentials |
| UC-P2: Manage Profile | Update name, phone, photo, emergency contact |
| UC-P3: Browse Rides | View list of available rides |
| UC-P4: Search/Filter Rides | Filter by destination, time, origin |
| UC-P5: View Ride Details | See ride info, rider profile & trust score |
| UC-P6: Request to Join | Send request to join a ride |
| UC-P7: Cancel Request | Cancel a pending request |
| UC-P8: View My Requests | Dashboard of all my ride requests |
| UC-P9: View Booked Rides | See confirmed upcoming rides |
| UC-P10: Rate Rider | Rate rider after completing a ride |
| UC-P11: View Ride History | See past completed rides |
| UC-P12: Request On-Demand Ride | Uber-style instant pickup request |
| UC-P13: Cancel On-Demand Request | Cancel a searching/pending request |

### Actor 3: Super Admin
System administrator with full control over the platform.

| Use Case | Description |
|----------|-------------|
| UC-A1: Admin Login | Login to admin panel |
| UC-A2: View All Users | List all riders and passengers |
| UC-A3: Activate/Deactivate User | Enable or disable user accounts |
| UC-A4: View All Rides | See all rides in the system |
| UC-A5: Cancel Any Ride | Force cancel problematic rides |
| UC-A6: View Dashboard Stats | See platform metrics (users, rides, etc.) |
| UC-A7: Verify Rider License | Review and approve/reject license submissions |
| UC-A8: Manage Reports | View/resolve user reports/complaints |
| UC-A9: View System Logs | Audit trail of activities |

---

## Tech Stack

- **Frontend**: Angular 19 (standalone components, Angular Material)
- **Backend**: .NET 9 Web API (Entity Framework Core)
- **Database**: Supabase (PostgreSQL)
- **Auth**: JWT tokens
- **Maps**: Leaflet.js with OpenStreetMap tiles
- **Geocoding**: Nominatim API for address search & reverse geocoding
- **Real-Time**: SignalR for live notifications & location tracking

## Project Structure (Monorepo)

```
ride-share/
├── src/
│   ├── RideShare.Api/          # .NET Web API project
│   │   ├── Controllers/        # API endpoints
│   │   │   ├── AdminController.cs
│   │   │   ├── AuthController.cs
│   │   │   ├── OnDemandController.cs
│   │   │   ├── RiderController.cs
│   │   │   └── RidesController.cs
│   │   ├── DTOs/               # Data transfer objects
│   │   ├── Services/           # Business logic
│   │   │   ├── AuthService.cs
│   │   │   ├── NotificationService.cs
│   │   │   ├── OnDemandService.cs
│   │   │   ├── RiderService.cs
│   │   │   └── RideService.cs
│   │   ├── Data/               # DbContext
│   │   ├── Hubs/               # SignalR hubs
│   │   ├── Configuration/      # Settings classes
│   │   ├── Migrations/         # EF Core migrations
│   │   └── RideShare.Api.csproj
│   │
│   ├── RideShare.Core/         # Shared domain/entities
│   │   ├── Entities/           # Domain models
│   │   └── RideShare.Core.csproj
│   │
│   └── RideShare.Web/          # Angular frontend
│       └── src/app/
│           ├── pages/          # Feature modules
│           │   ├── admin/      # License review, dashboard
│           │   │   ├── admin-dashboard/
│           │   │   └── license-review/
│           │   ├── rider/      # Post ride, my rides, profile
│           │   │   ├── active-ride/
│           │   │   ├── my-rides/
│           │   │   ├── nearby-requests/
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
│           │   │   ├── request-ondemand/
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
│           │   ├── ondemand-request-popup/
│           │   ├── rating-dialog/
│           │   ├── ride-accepted-dialog/
│           │   ├── ride-map/
│           │   ├── ride-request-popup/
│           │   ├── ride-status-dialog/
│           │   ├── route-preview/
│           │   └── unified-route-map/
│           ├── layouts/        # Layout components
│           │   ├── passenger-layout/
│           │   └── rider-layout/
│           ├── services/       # API services
│           │   ├── admin.service.ts
│           │   ├── auth.service.ts
│           │   ├── location-tracking.service.ts
│           │   ├── notification.service.ts
│           │   ├── ride.service.ts
│           │   ├── rider.service.ts
│           │   └── theme.service.ts
│           ├── guards/         # Route guards
│           ├── interceptors/   # HTTP interceptors
│           └── models/         # TypeScript interfaces
│
├── database/
│   ├── migrations/             # SQL migration scripts
│   └── seed/                   # Sample data scripts
│
├── docs/                       # Documentation
├── RideShare.sln               # .NET solution file
└── README.md
```

## Core Features (MVP)

### 1. User Authentication
- Register with email/password (choose role: Rider or Passenger)
- Login with JWT token
- User profile (name, phone, profile photo)
- Emergency contact info (name, phone, relationship)
- Role-based access (Rider, Passenger, Super Admin)

### 1.1 Rider Verification (Trust System)
- Riders must submit driving license for verification
- Admin reviews and approves/rejects licenses
- Verified badge displayed on rider profile
- Trust score based on:
  - License verification status
  - Total completed rides
  - Average rating from passengers
- Only verified riders can post rides

### 2. Ride Posting (Rider Flow)
- Create ride with:
  - Origin (address or area) with **map picker**
  - Destination (address or area) with **map picker**
  - **Location coordinates** (lat/lng) stored for map display
  - Departure date/time
  - Motorcycle info (model, plate number)
  - Helmet provided (yes/no)
  - Notes (e.g., "have extra helmet", "no heavy bags")
- **Interactive map components** for selecting locations:
  - Search autocomplete using Nominatim API
  - "Use Current Location" button (browser geolocation)
  - Click-to-select on map
  - Green marker for origin, red marker for destination
- Edit/cancel posted rides
- View and manage requests for each ride
- Mark rides as complete

### 3. Ride Discovery (Passenger Flow)
- Browse all available rides
- **List view** and **Map view** toggle
  - Map view shows all rides with origin/destination markers
  - Dashed lines connecting origin to destination
  - Click markers to see ride details
- Search/filter by:
  - Destination
  - Departure time range
  - Origin area
- View ride details and rider profile

### 4. Request System
- Passenger sends request to join a ride
- **Pickup & Drop-off Selection**: Interactive map with step-by-step UI
  - Step indicators showing progress (Pickup → Drop-off)
  - Click on map to set pickup point (green marker with "P")
  - Click on map to set drop-off point (red marker with "D")
  - Draggable markers for fine-tuning positions
  - Location name input for each point
  - Clear/reset functionality
  - Map legend showing all marker types
- Rider receives notification via SignalR
- Rider can view passenger's pickup & drop-off points
- Rider accepts or rejects request
- Both parties see confirmed booking with route details
- Passenger can cancel pending requests

### 5. Dashboards
- **Rider Dashboard**: Posted rides, incoming requests, ride history
- **Passenger Dashboard**: My requests, booked rides, ride history
- **Admin Dashboard**: User management, ride oversight, platform stats

### 6. On-Demand Ride Flow (Uber-Style)
- Passenger requests an instant pickup with pickup & drop-off coordinates
- Request broadcast to all nearby verified riders within configurable radius (default 10 km)
- Riders see the request card in `nearby-requests/` with distance, route info, and passenger details
- First rider to accept wins; request instantly moves to `Accepted` state
- A real `Ride` entity is automatically created on acceptance
- Passenger gets `ondemand_accepted` SignalR notification and is redirected to live tracking
- Request expires automatically after 15 minutes if no rider accepts (`ondemand_expired` notification)
- Accepted resume guard: only resume an accepted on-demand request if accepted within the last 2 hours
- Request status lifecycle: `Searching → Accepted → Completed | Cancelled | Expired`

---

## Database Schema

### Users Table
```sql
CREATE TABLE Users (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Email NVARCHAR(255) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(MAX) NOT NULL,
    FullName NVARCHAR(100) NOT NULL,
    Phone NVARCHAR(20),
    ProfilePhotoUrl NVARCHAR(500),
    Role NVARCHAR(20) NOT NULL, -- 'Rider', 'Passenger', 'Admin'
    IsActive BIT DEFAULT 1,
    -- Emergency Contact
    EmergencyContactName NVARCHAR(100),
    EmergencyContactPhone NVARCHAR(20),
    EmergencyContactRelation NVARCHAR(50),
    CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2
);
```

### RiderProfiles Table (License & Trust)
```sql
CREATE TABLE RiderProfiles (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UserId UNIQUEIDENTIFIER NOT NULL UNIQUE FOREIGN KEY REFERENCES Users(Id),
    LicenseNumber NVARCHAR(50),
    LicenseImageUrl NVARCHAR(500),
    LicenseExpiryDate DATE,
    IsLicenseVerified BIT DEFAULT 0,
    VerifiedAt DATETIME2,
    VerifiedByAdminId UNIQUEIDENTIFIER FOREIGN KEY REFERENCES Users(Id),
    -- Motorcycle Info
    MotorcycleModel NVARCHAR(100),
    PlateNumber NVARCHAR(20),
    -- Trust Score
    TotalRides INT DEFAULT 0,
    TotalRatings INT DEFAULT 0,
    AverageRating DECIMAL(3,2) DEFAULT 0,
    CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2
);
```

### Rides Table
```sql
CREATE TABLE Rides (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    RiderId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES Users(Id),
    Origin NVARCHAR(255) NOT NULL,
    OriginLat FLOAT,
    OriginLng FLOAT,
    Destination NVARCHAR(255) NOT NULL,
    DestinationLat FLOAT,
    DestinationLng FLOAT,
    DepartureTime DATETIME2 NOT NULL,
    HelmetProvided BIT DEFAULT 0,
    Notes NVARCHAR(500),
    Status NVARCHAR(20) DEFAULT 'Active', -- Active, InProgress, Booked, Completed, Cancelled
    -- Live tracking fields
    CurrentLat FLOAT,
    CurrentLng FLOAT,
    LastLocationUpdate DATETIME2,
    ArrivalNotified BIT DEFAULT 0,  -- Prevents duplicate rider_arrived notifications
    CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2
);
```

### RideRequests Table
```sql
CREATE TABLE RideRequests (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    RideId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES Rides(Id),
    PassengerId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES Users(Id),
    Status NVARCHAR(20) DEFAULT 'Pending', -- Pending, Accepted, Rejected, Cancelled
    Message NVARCHAR(500),
    -- Passenger's pickup/drop-off points
    PickupLocation NVARCHAR(255),
    PickupLat FLOAT,
    PickupLng FLOAT,
    DropoffLocation NVARCHAR(255),
    DropoffLat FLOAT,
    DropoffLng FLOAT,
    CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2
);
```

### OnDemandRequests Table
```sql
CREATE TABLE OnDemandRequests (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    PassengerId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES Users(Id),
    PickupLocation NVARCHAR(255) NOT NULL,
    PickupLat FLOAT NOT NULL,
    PickupLng FLOAT NOT NULL,
    DropoffLocation NVARCHAR(255) NOT NULL,
    DropoffLat FLOAT NOT NULL,
    DropoffLng FLOAT NOT NULL,
    RequestedTime DATETIME2 NOT NULL,
    ExpiresAt DATETIME2 NOT NULL,           -- Auto-expire after 15 mins
    Status NVARCHAR(20) DEFAULT 'Searching', -- Searching, Accepted, Cancelled, Expired, Completed
    AcceptedRiderId UNIQUEIDENTIFIER FOREIGN KEY REFERENCES Users(Id),
    AcceptedAt DATETIME2,
    RideId UNIQUEIDENTIFIER FOREIGN KEY REFERENCES Rides(Id),  -- Created on acceptance
    Message NVARCHAR(500),
    CreatedAt DATETIME2 DEFAULT GETUTCDATE()
);
```

### Ratings Table
```sql
CREATE TABLE Ratings (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    RideId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES Rides(Id),
    PassengerId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES Users(Id),
    RiderId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES Users(Id),
    Score INT NOT NULL CHECK (Score >= 1 AND Score <= 5),
    Comment NVARCHAR(500),
    CreatedAt DATETIME2 DEFAULT GETUTCDATE()
);
```

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user (Rider or Passenger) |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/me` | Get current user profile |
| PUT | `/api/auth/profile` | Update profile |
| PUT | `/api/auth/emergency-contact` | Update emergency contact info |

### Rider Profile & Verification
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/rider/profile` | Get my rider profile |
| PUT | `/api/rider/profile` | Update motorcycle info |
| POST | `/api/rider/license` | Submit license for verification |
| GET | `/api/rider/{id}/public` | Get public rider profile (for passengers) |

### Rides (Rider)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/rides` | List available rides (with filters) |
| GET | `/api/rides/{id}` | Get ride details |
| POST | `/api/rides` | Create new ride (rider only) |
| PUT | `/api/rides/{id}` | Update ride |
| DELETE | `/api/rides/{id}` | Cancel ride |
| PUT | `/api/rides/{id}/complete` | Mark ride as completed |
| GET | `/api/rides/my-posted` | Get rides I posted as rider |

### Ride Requests (Passenger)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/rides/{id}/requests` | Request to join ride |
| GET | `/api/rides/{id}/requests` | Get requests for my ride (rider) |
| PUT | `/api/requests/{id}/accept` | Accept request |
| PUT | `/api/requests/{id}/reject` | Reject request |
| GET | `/api/requests/my-requests` | Get my requests as passenger |
| DELETE | `/api/requests/{id}` | Cancel my request |

### Ratings
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/rides/{id}/rate` | Rate a completed ride |
| GET | `/api/rider/{id}/ratings` | Get rider's ratings |

### Live Tracking (SignalR)
| Hub | Method | Description |
|-----|--------|-------------|
| `/hubs/location` | `UpdateLocation` | Rider broadcasts GPS position |
| `/hubs/location` | `JoinRideTracking` | Passenger joins ride tracking |
| `/hubs/notifications` | `ReceiveNotification` | Real-time notifications |
### On-Demand Rides
| Method | Endpoint | Description |
|--------|----------|--------------|
| POST | `/api/on-demand/request` | Create on-demand request (Passenger) |
| GET | `/api/on-demand/my-requests` | Get my on-demand requests (Passenger) |
| GET | `/api/on-demand/request/{id}` | Get a specific request |
| DELETE | `/api/on-demand/request/{id}` | Cancel on-demand request (Passenger) |
| GET | `/api/on-demand/nearby` | Get nearby requests (Rider, ?lat=&lng=&radiusKm=) |
| POST | `/api/on-demand/request/{id}/accept` | Accept a request (verified Rider) |
| GET | `/api/on-demand/my-accepted` | Get rider's accepted request history |
### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/users` | List all users |
| PUT | `/api/admin/users/{id}/activate` | Activate user account |
| PUT | `/api/admin/users/{id}/deactivate` | Deactivate user account |
| GET | `/api/admin/rides` | List all rides |
| DELETE | `/api/admin/rides/{id}` | Force cancel a ride |
| GET | `/api/admin/stats` | Get platform statistics |
| GET | `/api/admin/license-requests` | List pending license verifications |
| PUT | `/api/admin/license/{id}/approve` | Approve rider's license |
| PUT | `/api/admin/license/{id}/reject` | Reject rider's license |

---

## Implementation Phases

### Phase 1: Foundation (Week 1) ✅
- [x] Set up monorepo structure
- [x] Create .NET solution with Api and Core projects
- [x] Set up Entity Framework Core with Supabase (PostgreSQL)
- [x] Implement User entity with Role support
- [x] Implement RiderProfile entity
- [x] Implement auth endpoints (register, login)
- [x] Create Angular project with routing
- [x] Build login/register pages (with role selection)
- [x] Implement JWT interceptor and route guards
- [x] Build profile page with emergency contact form

### Phase 2: Rider Verification (Week 2) ✅
- [x] Build license submission endpoints
- [x] Angular: Rider profile page with license upload
- [x] Angular: Admin license review page
- [x] Implement verification workflow
- [x] Add verified badge display logic

### Phase 3: Ride Management (Week 3) ✅
- [x] Implement Ride and RideRequest entities
- [x] Build ride CRUD endpoints (verified riders only)
- [x] Create ride request endpoints
- [x] Angular: Ride list page with search/filter
- [x] Angular: Ride detail page with rider trust info
- [x] Angular: Create/Edit ride form (Rider)
- [x] Angular: Rider dashboard
- [x] Angular: Passenger dashboard

### Phase 4: Admin Panel (Week 4) ✅
- [x] Implement admin endpoints (license verification)
- [x] Angular: Admin login/route guard
- [x] Angular: License review page
- [x] Angular: Admin dashboard

### Phase 5: Mobile & PWA Support ✅
- [x] Dark/Light mode with user-specific preference (toggle switch in profile menu)
- [x] Theme synced across devices via API
- [x] PWA support with service worker
- [x] Web app manifest for home screen install
- [x] PWA icons for all device sizes
- [x] Capacitor Android setup
- [x] Native plugins (GPS, Camera, Push, Preferences)
- [x] FCM token endpoint for push notifications
- [x] Splash screen and app colors
- [x] Custom Material confirm dialogs
- [x] Dark mode styling for all Material components
- [ ] Angular: User management page (future)
- [ ] Angular: Ride management page (future)
- [ ] Angular: Dashboard with stats (future)

### Phase 5: Real-Time & Maps (Week 5) ✅
- [x] Add rating system after ride completion
- [x] Add real-time notifications (SignalR)
- [x] Ride request popup cards for riders (bottom sheet with passenger route details, multi-request navigation, blurred background)
- [x] Integrate Leaflet.js maps for:
  - Ride posting (origin/destination selection)
  - Browse rides (map view with markers)
  - Ride tracking (live location updates)
  - Request dialog (pickup/drop-off selection)
- [x] Live ride tracking with SignalR:
  - Real-time location updates every 5 seconds
  - Rider shares location during active ride
  - Passenger tracks rider on map
  - ETA calculations
  - Route visualization
- [x] Pickup/Drop-off point selection for passengers

### Phase 6: On-Demand Ride Flow ✅
- [x] `OnDemandRequest` entity with status lifecycle (Searching → Accepted → Completed/Cancelled/Expired)
- [x] `OnDemandController` with create, cancel, nearby, accept endpoints
- [x] `OnDemandService` — request creation, nearby query (Haversine), first-accept race, expiry logic
- [x] Auto-create `Ride` entity on acceptance
- [x] `ondemand_accepted` and `ondemand_expired` SignalR notifications
- [x] Angular: `request-ondemand/` — step-by-step passenger request flow (pickup → drop-off → confirm → searching → accepted)
- [x] Angular: `nearby-requests/` — rider page with distance-sorted on-demand cards
- [x] Angular: `ondemand-request-popup/` — bottom sheet popup for riders (mirrors ride-request-popup style)
- [x] Angular: `ride-accepted-dialog/` — shown to passenger on acceptance (rider details + map)
- [x] Angular: `ride-status-dialog/` — ride state changes (started/completed/cancelled/arrived)
- [x] Angular: `active-ride/` — rider's in-progress ride view with live location sharing
- [x] Auto-fix stale accepted requests in `GetMyRequestsAsync` (linked ride already done)
- [x] Resume guard: only resume Accepted on-demand if `acceptedAt` within 2 hours
- [x] On-demand status synced to `Completed`/`Cancelled` when linked ride finishes

### Phase 7: Polish (Ongoing)
- [ ] Mobile responsiveness
- [ ] Email notifications
- [ ] Admin user management page
- [ ] Admin ride management page
- [ ] Admin dashboard with stats

---

## Getting Started Commands

```bash
# Create solution
dotnet new sln -n RideShare

# Create projects
dotnet new webapi -n RideShare.Api -o src/RideShare.Api
dotnet new classlib -n RideShare.Core -o src/RideShare.Core

# Add to solution
dotnet sln add src/RideShare.Api
dotnet sln add src/RideShare.Core

# Create Angular app
cd src
ng new RideShare.Web --routing --style=scss
```

---

## Notes

- Start simple, iterate based on learning goals
- Use Angular Material for quick, consistent UI
- Consider using AutoMapper for DTO mapping in .NET
- SQL scripts in `/database` for reference; EF migrations handle actual DB changes
