import { Component, OnInit, AfterViewChecked, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';
import { MatRippleModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth.service';
import { RiderService } from '../../services/rider.service';
import { RideService } from '../../services/ride.service';
import { PendingRequestWithRide } from '../../models/ride.model';
import { NotificationBellComponent } from '../../components/notification-bell/notification-bell.component';
import * as L from 'leaflet';

// Mobile-friendly Rider Dashboard with bottom navigation

@Component({
  selector: 'app-rider-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatListModule,
    MatDividerModule,
    MatBadgeModule,
    MatRippleModule,
    MatSnackBarModule,
    NotificationBellComponent
  ],
  template: `
    <!-- Top App Bar -->
    <div class="top-bar">
      <div class="top-bar-left">
        <mat-icon class="logo-icon">{{ getTabIcon() }}</mat-icon>
        <span class="app-title">{{ getTabTitle() }}</span>
      </div>
      <div class="top-bar-right">
        <app-notification-bell></app-notification-bell>
      </div>
    </div>

    <!-- Main Content Area -->
    <div class="content-area">
      <!-- Rides Tab -->
      @if (activeTab === 'rides') {
        <div class="tab-content rides-tab">
          <!-- Quick Actions -->
          <div class="quick-actions">
            <button class="action-card primary" routerLink="/rider/post-ride">
              <div class="action-icon">
                <mat-icon>add_circle</mat-icon>
              </div>
              <span class="action-label">Post New Ride</span>
            </button>
            <button class="action-card" (click)="activeTab = 'requests'">
              <div class="action-icon" [class.has-badge]="pendingRequestsList.length > 0">
                <mat-icon>person_add</mat-icon>
                @if (pendingRequestsList.length > 0) {
                  <span class="icon-badge">{{ pendingRequestsList.length }}</span>
                }
              </div>
              <span class="action-label">View Requests</span>
            </button>
          </div>

          <!-- Active Rides Section -->
          <div class="rides-section">
            <div class="section-title">
              <mat-icon>schedule</mat-icon>
              <span>Upcoming Rides</span>
            </div>
            @if (upcomingRides.length === 0) {
              <div class="empty-state">
                <mat-icon>event_busy</mat-icon>
                <p>No upcoming rides</p>
                <button mat-stroked-button color="primary" routerLink="/rider/post-ride">
                  Post your first ride
                </button>
              </div>
            } @else {
              <div class="rides-list">
                @for (ride of upcomingRides; track ride.id) {
                  <div class="ride-card" matRipple routerLink="/rider/my-rides">
                    <div class="ride-route">
                      <div class="route-point">
                        <span class="marker origin">A</span>
                        <span class="location">{{ getShortAddress(ride.origin) }}</span>
                      </div>
                      <mat-icon class="route-arrow">arrow_forward</mat-icon>
                      <div class="route-point">
                        <span class="marker dest">B</span>
                        <span class="location">{{ getShortAddress(ride.destination) }}</span>
                      </div>
                    </div>
                    <div class="ride-meta">
                      <span class="ride-time">
                        <mat-icon>schedule</mat-icon>
                        {{ formatDateTime(ride.departureTime) }}
                      </span>
                      <span class="ride-status" [class]="ride.status.toLowerCase()">
                        {{ ride.status }}
                      </span>
                    </div>
                  </div>
                }
              </div>
            }
          </div>

          <!-- Stats Overview -->
          <div class="stats-section">
            <div class="section-title">
              <mat-icon>insights</mat-icon>
              <span>Your Stats</span>
            </div>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-value">{{ totalRides }}</div>
                <div class="stat-label">Total Rides</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">{{ riderRating | number:'1.1-1' }}</div>
                <div class="stat-label">Rating</div>
                <mat-icon class="stat-icon">star</mat-icon>
              </div>
              <div class="stat-card">
                <div class="stat-value">{{ pendingRequests }}</div>
                <div class="stat-label">Pending</div>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Requests Tab -->
      @if (activeTab === 'requests') {
        <div class="tab-content requests-tab">
          <div class="section-header">
            <h2>Pending Requests</h2>
            @if (pendingRequestsList.length > 0) {
              <span class="header-badge">{{ pendingRequestsList.length }}</span>
            }
          </div>

          @if (pendingRequestsList.length === 0) {
            <div class="empty-state">
              <mat-icon>person_add</mat-icon>
              <p>No pending requests</p>
              <span class="empty-subtitle">When passengers request to join your rides, they'll appear here</span>
            </div>
          } @else {
            <div class="requests-list">
              @for (request of pendingRequestsList; track request.id) {
                <div class="request-card">
                  <!-- Passenger Header -->
                  <div class="request-header">
                    <div class="passenger-avatar">
                      @if (request.passengerPhoto) {
                        <img [src]="request.passengerPhoto" alt="Passenger">
                      } @else {
                        <mat-icon>person</mat-icon>
                      }
                    </div>
                    <div class="passenger-info">
                      <span class="passenger-name">{{ request.passengerName }}</span>
                      <span class="request-time">{{ formatRelativeTime(request.requestedAt) }}</span>
                    </div>
                    <span class="ride-time-badge">
                      <mat-icon>schedule</mat-icon>
                      {{ formatShortDateTime(request.departureTime) }}
                    </span>
                  </div>

                  <!-- Journey Visual -->
                  <div class="journey-visual">
                    <!-- Your Ride Route (dimmed background) -->
                    <div class="your-ride-label">
                      <mat-icon>two_wheeler</mat-icon>
                      <span>Your Route</span>
                    </div>
                    <div class="ride-route-bar">
                      <div class="route-endpoint start">
                        <span class="endpoint-marker">A</span>
                        <span class="endpoint-text">{{ getShortAddress(request.rideOrigin) }}</span>
                      </div>
                      <div class="route-line"></div>
                      <div class="route-endpoint end">
                        <span class="endpoint-marker">B</span>
                        <span class="endpoint-text">{{ getShortAddress(request.rideDestination) }}</span>
                      </div>
                    </div>

                    <!-- Passenger Journey (highlighted) -->
                    <div class="passenger-journey">
                      <div class="passenger-label">
                        <mat-icon>person</mat-icon>
                        <span>Passenger wants</span>
                      </div>
                      <div class="passenger-points">
                        <div class="passenger-point pickup">
                          <span class="point-marker pickup">P</span>
                          <div class="point-details">
                            <span class="point-label">Pick up at</span>
                            <span class="point-location">{{ request.pickupLocation ? getShortAddress(request.pickupLocation) : 'Ride start (A)' }}</span>
                          </div>
                        </div>
                        <mat-icon class="journey-arrow">east</mat-icon>
                        <div class="passenger-point dropoff">
                          <span class="point-marker dropoff">D</span>
                          <div class="point-details">
                            <span class="point-label">Drop off at</span>
                            <span class="point-location">{{ request.dropoffLocation ? getShortAddress(request.dropoffLocation) : 'Ride end (B)' }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Message -->
                  @if (request.message) {
                    <div class="request-message">
                      <mat-icon>chat_bubble_outline</mat-icon>
                      <span>{{ request.message }}</span>
                    </div>
                  }
                  
                  <!-- View Details Button -->
                  <button class="view-details-btn" (click)="toggleRequestDetails(request.id)">
                    <mat-icon>{{ expandedRequestId === request.id ? 'expand_less' : 'map' }}</mat-icon>
                    <span>{{ expandedRequestId === request.id ? 'Hide Map' : 'View Route' }}</span>
                  </button>
                  
                  <!-- Expandable Map Section -->
                  @if (expandedRequestId === request.id) {
                    <div class="map-preview-section">
                      <div class="map-container" [id]="'request-map-' + request.id"></div>
                      <div class="route-details-expanded">
                        <div class="detail-row">
                          <mat-icon class="origin-icon">trip_origin</mat-icon>
                          <div class="detail-text">
                            <span class="detail-label">From</span>
                            <span class="detail-value">{{ request.rideOrigin }}</span>
                          </div>
                        </div>
                        @if (request.pickupLocation) {
                          <div class="detail-row pickup">
                            <mat-icon class="pickup-icon">hail</mat-icon>
                            <div class="detail-text">
                              <span class="detail-label">Passenger Pickup</span>
                              <span class="detail-value">{{ request.pickupLocation }}</span>
                            </div>
                          </div>
                        }
                        @if (request.dropoffLocation) {
                          <div class="detail-row dropoff">
                            <mat-icon class="dropoff-icon">place</mat-icon>
                            <div class="detail-text">
                              <span class="detail-label">Passenger Dropoff</span>
                              <span class="detail-value">{{ request.dropoffLocation }}</span>
                            </div>
                          </div>
                        }
                        <div class="detail-row">
                          <mat-icon class="dest-icon">location_on</mat-icon>
                          <div class="detail-text">
                            <span class="detail-label">To</span>
                            <span class="detail-value">{{ request.rideDestination }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  }
                  
                  <div class="request-actions">
                    <button class="action-btn reject" (click)="rejectRequest(request)" [disabled]="processingRequest === request.id">
                      @if (processingRequest === request.id && processingAction === 'reject') {
                        <mat-icon class="spinning">sync</mat-icon>
                      } @else {
                        <mat-icon>close</mat-icon>
                      }
                      <span>Decline</span>
                    </button>
                    <button class="action-btn accept" (click)="acceptRequest(request)" [disabled]="processingRequest === request.id">
                      @if (processingRequest === request.id && processingAction === 'accept') {
                        <mat-icon class="spinning">sync</mat-icon>
                      } @else {
                        <mat-icon>check</mat-icon>
                      }
                      <span>Accept</span>
                    </button>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      }

      <!-- Profile Tab -->
      @if (activeTab === 'profile') {
        <div class="tab-content profile-tab">
          <!-- Profile Header -->
          <div class="profile-header">
            <div class="profile-avatar">
              @if (authService.currentUser()?.profilePhotoUrl) {
                <img [src]="authService.currentUser()?.profilePhotoUrl" alt="Profile">
              } @else {
                <mat-icon>person</mat-icon>
              }
            </div>
            <div class="profile-info">
              <h2>{{ authService.currentUser()?.fullName }}</h2>
              <p>{{ authService.currentUser()?.email }}</p>
              @if (isVerified) {
                <span class="verified-badge">
                  <mat-icon>verified</mat-icon>
                  Verified Rider
                </span>
              }
            </div>
          </div>

          <!-- Profile Menu -->
          <div class="profile-menu">
            <div class="menu-section">
              <div class="menu-item" matRipple routerLink="/rider/profile">
                <div class="menu-icon">
                  <mat-icon>badge</mat-icon>
                </div>
                <div class="menu-content">
                  <span class="menu-title">License Verification</span>
                  <span class="menu-subtitle">
                    @if (isVerified) {
                      Verified
                    } @else if (isPending) {
                      Pending review
                    } @else {
                      Submit your license
                    }
                  </span>
                </div>
                <mat-icon class="menu-arrow">chevron_right</mat-icon>
              </div>

              <div class="menu-item" matRipple routerLink="/rider/profile">
                <div class="menu-icon">
                  <mat-icon>two_wheeler</mat-icon>
                </div>
                <div class="menu-content">
                  <span class="menu-title">Motorcycle Info</span>
                  <span class="menu-subtitle">{{ motorcycleModel || 'Add your motorcycle details' }}</span>
                </div>
                <mat-icon class="menu-arrow">chevron_right</mat-icon>
              </div>

              <div class="menu-item" matRipple routerLink="/rider/profile">
                <div class="menu-icon">
                  <mat-icon>contact_phone</mat-icon>
                </div>
                <div class="menu-content">
                  <span class="menu-title">Emergency Contact</span>
                  <span class="menu-subtitle">{{ emergencyContact || 'Add emergency contact' }}</span>
                </div>
                <mat-icon class="menu-arrow">chevron_right</mat-icon>
              </div>
            </div>

            <div class="menu-section">
              <div class="menu-item" matRipple routerLink="/rider/my-rides">
                <div class="menu-icon">
                  <mat-icon>history</mat-icon>
                </div>
                <div class="menu-content">
                  <span class="menu-title">Ride History</span>
                  <span class="menu-subtitle">View all your past rides</span>
                </div>
                <mat-icon class="menu-arrow">chevron_right</mat-icon>
              </div>

              <div class="menu-item" matRipple>
                <div class="menu-icon">
                  <mat-icon>star</mat-icon>
                </div>
                <div class="menu-content">
                  <span class="menu-title">My Ratings</span>
                  <span class="menu-subtitle">{{ riderRating | number:'1.1-1' }} average from {{ totalRatings }} reviews</span>
                </div>
                <mat-icon class="menu-arrow">chevron_right</mat-icon>
              </div>
            </div>

            <div class="menu-section">
              <div class="menu-item logout" matRipple (click)="logout()">
                <div class="menu-icon logout">
                  <mat-icon>logout</mat-icon>
                </div>
                <div class="menu-content">
                  <span class="menu-title">Log Out</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      }
    </div>

    <!-- Bottom Navigation -->
    <nav class="bottom-nav">
      <button class="nav-item" [class.active]="activeTab === 'rides'" (click)="activeTab = 'rides'">
        <mat-icon>home</mat-icon>
        <span>Home</span>
      </button>
      <button class="nav-item" routerLink="/rider/my-rides">
        <mat-icon>list_alt</mat-icon>
        <span>My Rides</span>
      </button>
      <button class="nav-item" [class.active]="activeTab === 'requests'" (click)="activeTab = 'requests'">
        <mat-icon [matBadge]="pendingRequestsList.length" matBadgeSize="small" matBadgeColor="warn" [matBadgeHidden]="pendingRequestsList.length === 0">person_add</mat-icon>
        <span>Requests</span>
      </button>
      <button class="nav-item" [class.active]="activeTab === 'profile'" (click)="activeTab = 'profile'">
        <mat-icon>person</mat-icon>
        <span>Profile</span>
      </button>
    </nav>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      height: 100vh;
      background: #f5f7fa;
    }

    /* Top Bar */
    .top-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .top-bar-left {
      display: flex;
      align-items: center;
      gap: 8px;
      overflow: hidden;
      position: relative;
      width: 140px;
    }

    .logo-icon {
      color: #667eea;
      font-size: 28px;
      width: 28px;
      height: 28px;
      animation: ride-across 4s ease-in-out infinite;
      position: relative;
      z-index: 1;
    }

    .app-title {
      font-size: 20px;
      font-weight: 600;
      color: #333;
      position: relative;
      z-index: 2;
      background: white;
      padding-left: 4px;
    }

    @keyframes ride-across {
      0% {
        transform: translateX(-40px) rotate(0deg);
        opacity: 0;
      }
      10% {
        opacity: 1;
      }
      30% {
        transform: translateX(0px) rotate(0deg);
        opacity: 1;
      }
      55% {
        transform: translateX(0px) rotate(-360deg);
        opacity: 1;
      }
      75% {
        transform: translateX(20px) rotate(-360deg);
        opacity: 1;
      }
      100% {
        transform: translateX(35px) rotate(-360deg);
        opacity: 0;
      }
    }
    .top-bar-right {
      display: flex;
      align-items: center;
    }

    /* Content Area */
    .content-area {
      flex: 1;
      overflow-y: auto;
      padding-bottom: 80px;
    }

    .tab-content {
      padding: 16px;
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 16px;
    }

    .section-header h2 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
      color: #333;
    }

    .header-badge {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 13px;
      font-weight: 600;
    }

    .empty-subtitle {
      font-size: 13px;
      color: #999;
      margin-top: 4px;
    }

    /* Quick Actions */
    .quick-actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 24px;
    }

    .action-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 20px 16px;
      background: white;
      border: none;
      border-radius: 16px;
      cursor: pointer;
      transition: all 0.2s;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    }

    .action-card:active {
      transform: scale(0.98);
    }

    .action-card.primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .action-card.primary .action-icon {
      background: rgba(255,255,255,0.2);
    }

    .action-card.primary .action-icon mat-icon {
      color: white;
    }

    .action-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: #f0f3ff;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }

    .action-icon mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
      color: #667eea;
    }

    .icon-badge {
      position: absolute;
      top: -4px;
      right: -4px;
      background: #f44336;
      color: white;
      font-size: 11px;
      font-weight: 600;
      min-width: 18px;
      height: 18px;
      border-radius: 9px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 4px;
    }

    .action-label {
      font-size: 14px;
      font-weight: 500;
    }

    /* Pending Requests Section */
    .requests-section {
      margin-bottom: 24px;
    }

    .request-count {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 2px 8px;
      border-radius: 10px;
      font-size: 12px;
      font-weight: 600;
      margin-left: auto;
    }

    .requests-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .request-card {
      background: white;
      border-radius: 16px;
      padding: 16px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      border-left: 4px solid #667eea;
    }

    .request-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    }

    .passenger-avatar {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      flex-shrink: 0;
    }

    .passenger-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .passenger-avatar mat-icon {
      color: white;
      font-size: 22px;
      width: 22px;
      height: 22px;
    }

    .passenger-info {
      display: flex;
      flex-direction: column;
    }

    .passenger-name {
      font-size: 15px;
      font-weight: 600;
      color: #333;
    }

    .request-time {
      font-size: 12px;
      color: #999;
      margin-top: 2px;
    }

    .ride-time-badge {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      background: #f0f0f0;
      border-radius: 12px;
      font-size: 11px;
      color: #666;
      margin-left: auto;
    }

    .ride-time-badge mat-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }

    /* Journey Visual */
    .journey-visual {
      background: #f8f9fc;
      border-radius: 12px;
      padding: 12px;
      margin-bottom: 12px;
    }

    .your-ride-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      color: #999;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }

    .your-ride-label mat-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }

    .ride-route-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: white;
      border-radius: 8px;
      margin-bottom: 12px;
    }

    .route-endpoint {
      display: flex;
      align-items: center;
      gap: 6px;
      flex: 1;
      min-width: 0;
    }

    .route-endpoint.end {
      justify-content: flex-end;
      text-align: right;
    }

    .endpoint-marker {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      font-weight: bold;
      color: white;
      flex-shrink: 0;
    }

    .route-endpoint.start .endpoint-marker {
      background: linear-gradient(135deg, #4caf50, #2e7d32);
    }

    .route-endpoint.end .endpoint-marker {
      background: linear-gradient(135deg, #f44336, #c62828);
    }

    .endpoint-text {
      font-size: 12px;
      color: #666;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .route-line {
      flex: 0 0 40px;
      height: 2px;
      background: linear-gradient(90deg, #4caf50, #f44336);
      border-radius: 1px;
    }

    /* Passenger Journey */
    .passenger-journey {
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.08), rgba(118, 75, 162, 0.08));
      border: 1px solid rgba(102, 126, 234, 0.2);
      border-radius: 10px;
      padding: 10px;
    }

    .passenger-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      color: #667eea;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 10px;
    }

    .passenger-label mat-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }

    .passenger-points {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .passenger-point {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px;
      background: white;
      border-radius: 8px;
      min-width: 0;
    }

    .point-marker {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: bold;
      color: white;
      flex-shrink: 0;
    }

    .point-marker.pickup {
      background: linear-gradient(135deg, #2196f3, #1565c0);
    }

    .point-marker.dropoff {
      background: linear-gradient(135deg, #ff9800, #ef6c00);
    }

    .point-icon mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .point-details {
      display: flex;
      flex-direction: column;
      min-width: 0;
      flex: 1;
    }

    .point-label {
      font-size: 10px;
      color: #999;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .point-location {
      font-size: 12px;
      font-weight: 500;
      color: #333;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .journey-arrow {
      color: #ccc;
      font-size: 18px;
      flex-shrink: 0;
    }

    .request-message {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      font-size: 13px;
      color: #666;
      margin-bottom: 12px;
      padding: 10px 12px;
      background: #f5f5f5;
      border-radius: 8px;
    }

    .request-message mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: #999;
      flex-shrink: 0;
      margin-top: 1px;
    }

    /* View Details Button */
    .view-details-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      width: 100%;
      padding: 10px;
      margin-bottom: 12px;
      border: 1px dashed #667eea;
      border-radius: 10px;
      background: #f8f9ff;
      color: #667eea;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .view-details-btn:hover {
      background: #eef1ff;
      border-style: solid;
    }

    .view-details-btn mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    /* Map Preview Section */
    .map-preview-section {
      margin-bottom: 12px;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid #e0e0e0;
    }

    .map-container {
      height: 180px;
      width: 100%;
      background: #e8e8e8;
    }

    .route-details-expanded {
      padding: 12px;
      background: #fafafa;
    }

    .detail-row {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 8px 0;
      border-bottom: 1px solid #f0f0f0;
    }

    .detail-row:last-child {
      border-bottom: none;
    }

    .detail-row mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      margin-top: 2px;
    }

    .origin-icon {
      color: #4caf50;
    }

    .pickup-icon {
      color: #2196f3;
    }

    .dropoff-icon {
      color: #ff9800;
    }

    .dest-icon {
      color: #f44336;
    }

    .detail-text {
      display: flex;
      flex-direction: column;
      flex: 1;
    }

    .detail-label {
      font-size: 11px;
      color: #999;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .detail-value {
      font-size: 13px;
      color: #333;
      margin-top: 2px;
    }

    .request-actions {
      display: flex;
      gap: 12px;
    }

    .action-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 12px;
      border: none;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .action-btn:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    .action-btn mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .action-btn.reject {
      background: #f5f5f5;
      color: #666;
    }

    .action-btn.reject:hover:not(:disabled) {
      background: #ffebee;
      color: #f44336;
    }

    .action-btn.accept {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .action-btn.accept:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .spinning {
      animation: spin 1s linear infinite;
    }

    /* Section Titles */
    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
      color: #666;
      font-size: 14px;
      font-weight: 500;
    }

    .section-title mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    /* Rides Section */
    .rides-section {
      margin-bottom: 24px;
    }

    .rides-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .ride-card {
      background: white;
      border-radius: 16px;
      padding: 16px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      cursor: pointer;
    }

    .ride-route {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
    }

    .route-point {
      display: flex;
      align-items: center;
      gap: 6px;
      flex: 1;
      min-width: 0;
    }

    .marker {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: bold;
      color: white;
      flex-shrink: 0;
    }

    .marker.origin {
      background: linear-gradient(135deg, #4caf50, #2e7d32);
    }

    .marker.dest {
      background: linear-gradient(135deg, #f44336, #c62828);
    }

    .location {
      font-size: 14px;
      font-weight: 500;
      color: #333;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .route-arrow {
      color: #ccc;
      font-size: 18px;
      flex-shrink: 0;
    }

    .ride-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .ride-time {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 13px;
      color: #666;
    }

    .ride-time mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .ride-status {
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
    }

    .ride-status.active {
      background: #e3f2fd;
      color: #1976d2;
    }

    .ride-status.booked {
      background: #e8f5e9;
      color: #2e7d32;
    }

    .ride-status.inprogress {
      background: #fff3e0;
      color: #ef6c00;
    }

    /* Stats Section */
    .stats-section {
      margin-bottom: 24px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
    }

    .stat-card {
      background: white;
      border-radius: 16px;
      padding: 16px;
      text-align: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      position: relative;
    }

    .stat-value {
      font-size: 24px;
      font-weight: 700;
      color: #333;
    }

    .stat-label {
      font-size: 12px;
      color: #666;
      margin-top: 4px;
    }

    .stat-icon {
      position: absolute;
      top: 8px;
      right: 8px;
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: #ffc107;
    }

    /* Empty State */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 32px;
      background: white;
      border-radius: 16px;
      text-align: center;
    }

    .empty-state mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #ccc;
      margin-bottom: 12px;
    }

    .empty-state p {
      color: #666;
      margin: 0 0 16px;
    }

    /* Activity Tab */
    .activity-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .activity-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: white;
      border-radius: 12px;
      cursor: pointer;
    }

    .activity-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .activity-icon.request {
      background: #e3f2fd;
      color: #1976d2;
    }

    .activity-icon.accepted {
      background: #e8f5e9;
      color: #2e7d32;
    }

    .activity-icon.completed {
      background: #f3e5f5;
      color: #7b1fa2;
    }

    .activity-icon.rating {
      background: #fff8e1;
      color: #ffc107;
    }

    .activity-content {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-width: 0;
    }

    .activity-title {
      font-size: 14px;
      font-weight: 500;
      color: #333;
    }

    .activity-desc {
      font-size: 13px;
      color: #666;
      margin-top: 2px;
    }

    .activity-time {
      font-size: 12px;
      color: #999;
      margin-top: 4px;
    }

    .activity-arrow {
      color: #ccc;
      flex-shrink: 0;
    }

    /* Profile Tab */
    .profile-header {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 24px 16px;
      background: white;
      border-radius: 20px;
      margin-bottom: 16px;
    }

    .profile-avatar {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    .profile-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .profile-avatar mat-icon {
      font-size: 36px;
      width: 36px;
      height: 36px;
      color: white;
    }

    .profile-info {
      flex: 1;
    }

    .profile-info h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
      color: #333;
    }

    .profile-info p {
      margin: 4px 0 0;
      font-size: 14px;
      color: #666;
    }

    .verified-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      margin-top: 8px;
      padding: 4px 10px;
      background: #e8f5e9;
      color: #2e7d32;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
    }

    .verified-badge mat-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }

    /* Profile Menu */
    .profile-menu {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .menu-section {
      background: white;
      border-radius: 16px;
      overflow: hidden;
    }

    .menu-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      cursor: pointer;
      border-bottom: 1px solid #f0f0f0;
    }

    .menu-item:last-child {
      border-bottom: none;
    }

    .menu-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: #f5f7fa;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #667eea;
    }

    .menu-icon.logout {
      background: #ffebee;
      color: #f44336;
    }

    .menu-content {
      flex: 1;
      min-width: 0;
    }

    .menu-title {
      display: block;
      font-size: 15px;
      font-weight: 500;
      color: #333;
    }

    .menu-item.logout .menu-title {
      color: #f44336;
    }

    .menu-subtitle {
      display: block;
      font-size: 13px;
      color: #666;
      margin-top: 2px;
    }

    .menu-arrow {
      color: #ccc;
    }

    /* Bottom Navigation */
    .bottom-nav {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      display: flex;
      justify-content: space-around;
      background: white;
      padding: 8px 0;
      padding-bottom: max(8px, env(safe-area-inset-bottom));
      box-shadow: 0 -2px 12px rgba(0,0,0,0.08);
      z-index: 100;
    }

    .nav-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      padding: 8px 24px;
      background: none;
      border: none;
      cursor: pointer;
      color: #999;
      transition: color 0.2s;
    }

    .nav-item mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .nav-item span {
      font-size: 12px;
      font-weight: 500;
    }

    .nav-item.active {
      color: #667eea;
    }

    .nav-item.active mat-icon {
      color: #667eea;
    }
  `]
})
export class RiderDashboardComponent implements OnInit, AfterViewChecked, OnDestroy {
  activeTab: 'rides' | 'requests' | 'profile' = 'rides';
  
  // Rider stats
  totalRides = 0;
  riderRating = 0;
  totalRatings = 0;
  pendingRequests = 0;
  isVerified = false;
  isPending = false;
  motorcycleModel = '';
  emergencyContact = '';
  
  // Data
  upcomingRides: any[] = [];
  activities: any[] = [];
  pendingRequestsList: PendingRequestWithRide[] = [];
  
  // Processing state
  processingRequest: string | null = null;
  processingAction: 'accept' | 'reject' | null = null;
  
  // Map expansion state
  expandedRequestId: string | null = null;
  private mapInitialized = false;
  private requestMaps: Map<string, L.Map> = new Map();

  constructor(
    public authService: AuthService,
    private riderService: RiderService,
    private rideService: RideService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Check for tab query param
    this.route.queryParams.subscribe(params => {
      if (params['tab'] && ['rides', 'requests', 'profile'].includes(params['tab'])) {
        this.activeTab = params['tab'] as 'rides' | 'requests' | 'profile';
      }
    });
    
    this.loadRiderProfile();
    this.loadUpcomingRides();
    this.loadPendingRequests();
    this.loadActivities();
  }

  ngAfterViewChecked(): void {
    if (this.expandedRequestId && !this.mapInitialized) {
      this.initializeMap(this.expandedRequestId);
    }
  }

  ngOnDestroy(): void {
    // Cleanup all maps
    this.requestMaps.forEach(map => map.remove());
    this.requestMaps.clear();
  }

  toggleRequestDetails(requestId: string): void {
    if (this.expandedRequestId === requestId) {
      // Cleanup existing map
      const existingMap = this.requestMaps.get(requestId);
      if (existingMap) {
        existingMap.remove();
        this.requestMaps.delete(requestId);
      }
      this.expandedRequestId = null;
      this.mapInitialized = false;
    } else {
      // Cleanup previous map if any
      if (this.expandedRequestId) {
        const existingMap = this.requestMaps.get(this.expandedRequestId);
        if (existingMap) {
          existingMap.remove();
          this.requestMaps.delete(this.expandedRequestId);
        }
      }
      this.expandedRequestId = requestId;
      this.mapInitialized = false;
    }
  }

  private initializeMap(requestId: string): void {
    const mapContainer = document.getElementById(`request-map-${requestId}`);
    if (!mapContainer || this.requestMaps.has(requestId)) return;

    const request = this.pendingRequestsList.find(r => r.id === requestId);
    if (!request) return;

    this.mapInitialized = true;

    // Create map
    const map = L.map(`request-map-${requestId}`, {
      zoomControl: false,
      attributionControl: false
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);

    this.requestMaps.set(requestId, map);

    // Collect all points for bounds
    const points: L.LatLngExpression[] = [];

    // Custom icons
    const originIcon = L.divIcon({
      className: 'custom-marker',
      html: '<div style="background: linear-gradient(135deg, #4caf50, #2e7d32); color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">A</div>',
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });

    const destIcon = L.divIcon({
      className: 'custom-marker',
      html: '<div style="background: linear-gradient(135deg, #f44336, #c62828); color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">B</div>',
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });

    const pickupIcon = L.divIcon({
      className: 'custom-marker',
      html: '<div style="background: linear-gradient(135deg, #2196f3, #1565c0); color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">P</div>',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    const dropoffIcon = L.divIcon({
      className: 'custom-marker',
      html: '<div style="background: linear-gradient(135deg, #ff9800, #ef6c00); color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">D</div>',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    // Default to Dhaka if no coordinates
    const defaultLat = 23.8103;
    const defaultLng = 90.4125;

    // Get ride origin/destination coordinates (use defaults if not available)
    const rideOriginLat = request.rideOriginLat || defaultLat;
    const rideOriginLng = request.rideOriginLng || defaultLng;
    const rideDestLat = request.rideDestLat || (defaultLat + 0.015);
    const rideDestLng = request.rideDestLng || (defaultLng + 0.015);

    // Passenger pickup: use custom if provided, otherwise use ride origin with slight offset
    const pickupLat = request.pickupLat || (rideOriginLat + 0.003);
    const pickupLng = request.pickupLng || (rideOriginLng + 0.003);
    const pickupLabel = request.pickupLocation || 'Same as ride start';

    // Passenger dropoff: use custom if provided, otherwise use ride destination with slight offset
    const dropoffLat = request.dropoffLat || (rideDestLat - 0.003);
    const dropoffLng = request.dropoffLng || (rideDestLng - 0.003);
    const dropoffLabel = request.dropoffLocation || 'Same as ride end';

    // 1. Add ride origin marker (A - green)
    L.marker([rideOriginLat, rideOriginLng], { icon: originIcon })
      .addTo(map)
      .bindPopup(`<b>Ride Start</b><br>${request.rideOrigin}`);
    points.push([rideOriginLat, rideOriginLng]);

    // 2. Add passenger pickup marker (P - blue)
    L.marker([pickupLat, pickupLng], { icon: pickupIcon })
      .addTo(map)
      .bindPopup(`<b>Passenger Pickup</b><br>${pickupLabel}`);
    points.push([pickupLat, pickupLng]);

    // 3. Add passenger dropoff marker (D - orange)
    L.marker([dropoffLat, dropoffLng], { icon: dropoffIcon })
      .addTo(map)
      .bindPopup(`<b>Passenger Dropoff</b><br>${dropoffLabel}`);
    points.push([dropoffLat, dropoffLng]);

    // 4. Add ride destination marker (B - red)
    L.marker([rideDestLat, rideDestLng], { icon: destIcon })
      .addTo(map)
      .bindPopup(`<b>Ride End</b><br>${request.rideDestination}`);
    points.push([rideDestLat, rideDestLng]);

    // Draw route line connecting all points in order: A -> P -> D -> B
    L.polyline(points, {
      color: '#667eea',
      weight: 4,
      opacity: 0.8,
      dashArray: '10, 10'
    }).addTo(map);

    // Fit bounds with padding
    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [30, 30] });

    // Invalidate size after a short delay to ensure proper rendering
    setTimeout(() => map.invalidateSize(), 100);
  }

  loadRiderProfile(): void {
    this.riderService.getMyProfile().subscribe({
      next: (profile) => {
        this.isVerified = profile.isLicenseVerified;
        this.isPending = !!profile.licenseNumber && !profile.isLicenseVerified;
        this.motorcycleModel = profile.motorcycleModel || '';
        this.totalRides = profile.totalRides || 0;
        this.riderRating = profile.averageRating || 0;
        this.totalRatings = profile.totalRatings || 0;
      },
      error: () => {}
    });

    // Load emergency contact from user profile
    const user = this.authService.currentUser();
    if (user?.emergencyContact?.name) {
      this.emergencyContact = user.emergencyContact.name;
    }
  }

  loadUpcomingRides(): void {
    this.rideService.getMyPostedRides().subscribe({
      next: (rides) => {
        // Filter to upcoming rides (Active or Booked status)
        this.upcomingRides = rides
          .filter(r => r.status === 'Active' || r.status === 'Booked' || r.status === 'InProgress')
          .slice(0, 3);
        
        // Count pending requests
        this.pendingRequests = rides.reduce((sum, r) => sum + (r.requestCount || 0), 0);
      },
      error: () => {}
    });
  }

  loadPendingRequests(): void {
    this.rideService.getMyPendingRequests().subscribe({
      next: (requests) => {
        this.pendingRequestsList = requests;
        this.pendingRequests = requests.length;
      },
      error: () => {}
    });
  }

  acceptRequest(request: PendingRequestWithRide): void {
    this.processingRequest = request.id;
    this.processingAction = 'accept';
    
    this.rideService.acceptRequest(request.id).subscribe({
      next: () => {
        this.snackBar.open(`Accepted ${request.passengerName}'s request!`, 'Close', {
          duration: 3000,
          panelClass: 'success-snackbar'
        });
        this.loadPendingRequests();
        this.loadUpcomingRides();
        this.processingRequest = null;
        this.processingAction = null;
      },
      error: () => {
        this.snackBar.open('Failed to accept request. Please try again.', 'Close', {
          duration: 3000,
          panelClass: 'error-snackbar'
        });
        this.processingRequest = null;
        this.processingAction = null;
      }
    });
  }

  rejectRequest(request: PendingRequestWithRide): void {
    this.processingRequest = request.id;
    this.processingAction = 'reject';
    
    this.rideService.rejectRequest(request.id).subscribe({
      next: () => {
        this.snackBar.open('Request declined', 'Close', {
          duration: 3000
        });
        this.loadPendingRequests();
        this.processingRequest = null;
        this.processingAction = null;
      },
      error: () => {
        this.snackBar.open('Failed to decline request. Please try again.', 'Close', {
          duration: 3000,
          panelClass: 'error-snackbar'
        });
        this.processingRequest = null;
        this.processingAction = null;
      }
    });
  }

  loadActivities(): void {
    // Mock activity data - in real app, this would come from an API
    this.activities = [
      { id: 1, type: 'request', title: 'New ride request', description: 'John Doe requested to join your ride', time: '2 hours ago' },
      { id: 2, type: 'rating', title: 'New rating received', description: 'You received a 5-star rating', time: '1 day ago' },
      { id: 3, type: 'completed', title: 'Ride completed', description: 'Mirpur → Dhanmondi', time: '2 days ago' },
    ];
  }

  getTabIcon(): string {
    switch (this.activeTab) {
      case 'rides': return 'electric_moped';
      case 'requests': return 'person_add';
      case 'profile': return 'person';
      default: return 'electric_moped';
    }
  }

  getTabTitle(): string {
    switch (this.activeTab) {
      case 'rides': return 'Rider';
      case 'requests': return 'Pending Requests';
      case 'profile': return 'Profile';
      default: return 'Rider';
    }
  }

  getShortAddress(address: string): string {
    if (!address) return '';
    const parts = address.split(',');
    return parts[0].trim().substring(0, 20) + (parts[0].length > 20 ? '...' : '');
  }

  formatDateTime(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatShortDateTime(dateStr: string): string {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const isToday = date.toDateString() === today.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();

    const timeStr = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    if (isToday) return `Today ${timeStr}`;
    if (isTomorrow) return `Tomorrow ${timeStr}`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  getActivityIcon(type: string): string {
    const icons: Record<string, string> = {
      'request': 'person_add',
      'accepted': 'check_circle',
      'completed': 'done_all',
      'rating': 'star'
    };
    return icons[type] || 'notifications';
  }

  formatRelativeTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  }

  logout(): void {
    this.authService.logout();
  }
}
