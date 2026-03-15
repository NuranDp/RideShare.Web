import { Component, AfterViewInit, OnDestroy, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { trigger, style, transition, animate } from '@angular/animations';
import { RideService } from '../../services/ride.service';
import { Ride } from '../../models/ride.model';
import * as L from 'leaflet';

@Component({
  selector: 'app-request-ride',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatCardModule
  ],
  animations: [
    trigger('fadeSlide', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('scaleIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.8)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
      ])
    ])
  ],
  template: `
    <div class="page-container">
      <!-- Fixed Back Button -->
      <button mat-icon-button class="back-btn-fixed" routerLink="/passenger/browse-rides">
        <mat-icon>arrow_back</mat-icon>
      </button>

      <!-- Loading State -->
      @if (loading) {
        <div class="loading-container">
          <mat-spinner diameter="48"></mat-spinner>
          <p>Loading ride details...</p>
        </div>
      }

      <!-- Error State -->
      @if (error) {
        <div class="error-container">
          <mat-icon>error_outline</mat-icon>
          <h2>Ride not found</h2>
          <p>{{ error }}</p>
          <button mat-raised-button color="primary" (click)="goBack()">
            <mat-icon>arrow_back</mat-icon>
            Go Back
          </button>
        </div>
      }

      <!-- Main Content -->
      @if (ride && !loading && !error) {
        <!-- Page Header -->
        <div class="page-header">
          <div class="header-content">
            <div class="header-icon">
              <mat-icon>two_wheeler</mat-icon>
            </div>
            <div class="header-text">
              <h1>Request to Join Ride</h1>
              <p>Select your pickup & drop-off points on the map</p>
            </div>
          </div>
        </div>

        <div class="content-wrapper">
          <!-- Left Column: Info & Controls -->
          <div class="info-column">
            <!-- Ride Summary Card -->
            <mat-card class="ride-summary-card">
              <mat-card-header>
                <mat-icon mat-card-avatar class="route-icon">route</mat-icon>
                <mat-card-title>Route Details</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <div class="route-flow">
                  <div class="route-point origin">
                    <div class="point-marker origin">A</div>
                    <div class="point-info">
                      <span class="label">From</span>
                      <span class="address">{{ ride.origin }}</span>
                    </div>
                  </div>
                  <div class="route-connector">
                    <mat-icon>south</mat-icon>
                  </div>
                  <div class="route-point destination">
                    <div class="point-marker dest">B</div>
                    <div class="point-info">
                      <span class="label">To</span>
                      <span class="address">{{ ride.destination }}</span>
                    </div>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>

            <!-- Rider Info Card -->
            <mat-card class="rider-info-card">
              <mat-card-content>
                <div class="rider-details">
                  <div class="rider-avatar">
                    @if (ride.riderPhoto) {
                      <img [src]="ride.riderPhoto" alt="Rider">
                    } @else {
                      <mat-icon>person</mat-icon>
                    }
                  </div>
                  <div class="rider-info">
                    <span class="rider-name">{{ ride.riderName }}</span>
                    <div class="rider-meta">
                      <span class="rating">
                        <mat-icon>star</mat-icon>
                        {{ ride.riderRating.toFixed(1) }}
                      </span>
                      <span class="rides">{{ ride.riderTotalRides }} rides</span>
                    </div>
                  </div>
                </div>
                <div class="ride-badges">
                  <span class="badge time">
                    <mat-icon>schedule</mat-icon>
                    {{ formatDateTime(ride.departureTime) }}
                  </span>
                  @if (ride.helmetProvided) {
                    <span class="badge helmet">
                      <mat-icon>sports_motorsports</mat-icon>
                      Helmet provided
                    </span>
                  }
                  @if (ride.motorcycleModel) {
                    <span class="badge bike">
                      <mat-icon>two_wheeler</mat-icon>
                      {{ ride.motorcycleModel }}
                    </span>
                  }
                </div>
              </mat-card-content>
            </mat-card>

            <!-- Pickup & Dropoff Selection -->
            <mat-card class="selection-card">
              <mat-card-header>
                <mat-icon mat-card-avatar>pin_drop</mat-icon>
                <mat-card-title>Your Stops</mat-card-title>
                <mat-card-subtitle>Click on the map or search below</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <!-- Mode Toggle -->
                <div class="mode-toggle">
                  <button class="mode-btn pickup" 
                          [class.active]="selectionMode === 'pickup'"
                          (click)="selectionMode = 'pickup'">
                    <div class="mode-marker pickup">P</div>
                    <span>Pickup</span>
                    @if (pickupLat) {
                      <mat-icon class="check">check_circle</mat-icon>
                    }
                  </button>
                  <button class="mode-btn dropoff" 
                          [class.active]="selectionMode === 'dropoff'"
                          (click)="selectionMode = 'dropoff'">
                    <div class="mode-marker dropoff">D</div>
                    <span>Drop-off</span>
                    @if (dropoffLat) {
                      <mat-icon class="check">check_circle</mat-icon>
                    }
                  </button>
                </div>

                <!-- Pickup Point -->
                <div class="point-input" [class.active]="selectionMode === 'pickup'" (click)="selectionMode = 'pickup'">
                  <div class="point-badge pickup">P</div>
                  <div class="input-wrapper">
                    <mat-form-field appearance="outline" class="search-field">
                      <mat-icon matPrefix>search</mat-icon>
                      <input matInput 
                             [(ngModel)]="pickupSearchQuery"
                             (input)="onSearchInput('pickup')"
                             (focus)="onSearchFocus('pickup')"
                             (blur)="onSearchBlur('pickup')"
                             placeholder="Search pickup location...">
                      @if (pickupSearchQuery) {
                        <button mat-icon-button matSuffix (click)="clearSearch('pickup', $event)">
                          <mat-icon>close</mat-icon>
                        </button>
                      }
                    </mat-form-field>
                    @if (showPickupResults && pickupSearchResults.length > 0) {
                      <div class="search-results">
                        @for (result of pickupSearchResults; track result.place_id) {
                          <div class="search-result-item" (mousedown)="selectSearchResult(result, 'pickup', $event)">
                            <mat-icon>place</mat-icon>
                            <div class="result-text">
                              <span class="name">{{ result.display_name.split(',')[0] }}</span>
                              <span class="address">{{ getShortDisplayName(result.display_name) }}</span>
                            </div>
                          </div>
                        }
                      </div>
                    }
                    @if (pickupSearching) {
                      <div class="search-loading">
                        <mat-spinner diameter="20"></mat-spinner>
                        <span>Searching...</span>
                      </div>
                    }
                  </div>
                  @if (pickupLocation) {
                    <div class="selected-badge">
                      <mat-icon>check_circle</mat-icon>
                      Set
                    </div>
                  }
                </div>

                <!-- Dropoff Point -->
                <div class="point-input" [class.active]="selectionMode === 'dropoff'" (click)="selectionMode = 'dropoff'">
                  <div class="point-badge dropoff">D</div>
                  <div class="input-wrapper">
                    <mat-form-field appearance="outline" class="search-field">
                      <mat-icon matPrefix>search</mat-icon>
                      <input matInput 
                             [(ngModel)]="dropoffSearchQuery"
                             (input)="onSearchInput('dropoff')"
                             (focus)="onSearchFocus('dropoff')"
                             (blur)="onSearchBlur('dropoff')"
                             placeholder="Search drop-off location...">
                      @if (dropoffSearchQuery) {
                        <button mat-icon-button matSuffix (click)="clearSearch('dropoff', $event)">
                          <mat-icon>close</mat-icon>
                        </button>
                      }
                    </mat-form-field>
                    @if (showDropoffResults && dropoffSearchResults.length > 0) {
                      <div class="search-results">
                        @for (result of dropoffSearchResults; track result.place_id) {
                          <div class="search-result-item" (mousedown)="selectSearchResult(result, 'dropoff', $event)">
                            <mat-icon>place</mat-icon>
                            <div class="result-text">
                              <span class="name">{{ result.display_name.split(',')[0] }}</span>
                              <span class="address">{{ getShortDisplayName(result.display_name) }}</span>
                            </div>
                          </div>
                        }
                      </div>
                    }
                    @if (dropoffSearching) {
                      <div class="search-loading">
                        <mat-spinner diameter="20"></mat-spinner>
                        <span>Searching...</span>
                      </div>
                    }
                  </div>
                  @if (dropoffLocation) {
                    <div class="selected-badge">
                      <mat-icon>check_circle</mat-icon>
                      Set
                    </div>
                  }
                </div>

                @if (pickupLat || dropoffLat) {
                  <button mat-button class="reset-btn" (click)="resetPoints()">
                    <mat-icon>refresh</mat-icon>
                    Reset Points
                  </button>
                }
              </mat-card-content>
            </mat-card>

            <!-- Message Card -->
            <mat-card class="message-card">
              <mat-card-header>
                <mat-icon mat-card-avatar>chat_bubble_outline</mat-icon>
                <mat-card-title>Message to Rider</mat-card-title>
                <mat-card-subtitle>Optional</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <mat-form-field appearance="outline" class="message-field">
                  <textarea matInput 
                            [(ngModel)]="message" 
                            rows="3"
                            maxlength="200"
                            placeholder="Introduce yourself or add any notes..."></textarea>
                  <mat-hint align="end">{{ message.length }}/200</mat-hint>
                </mat-form-field>
              </mat-card-content>
            </mat-card>

            <!-- Action Buttons -->
            <div class="action-buttons">
              <button mat-stroked-button class="cancel-btn" (click)="goBack()" [disabled]="sending">
                Cancel
              </button>
              <button mat-raised-button 
                      class="send-btn"
                      [class.ready]="isValid()"
                      (click)="sendRequest()" 
                      [disabled]="sending || !isValid()">
                @if (sending) {
                  <mat-spinner diameter="20"></mat-spinner>
                  <span>Sending...</span>
                } @else {
                  <ng-container>
                    <mat-icon>send</mat-icon>
                    <span>Send Request</span>
                  </ng-container>
                }
              </button>
            </div>
          </div>

          <!-- Right Column: Map -->
          <div class="map-column">
            <div class="map-wrapper">
              <div id="request-map" class="map-container"></div>
              
              @if (routeLoading) {
                <div class="route-loading-overlay">
                  <mat-spinner diameter="36"></mat-spinner>
                  <span>Calculating route...</span>
                </div>
              }
              
              @if (!pickupLat && !dropoffLat) {
                <div class="floating-instruction" @fadeSlide>
                  <mat-icon>touch_app</mat-icon>
                  <span>Tap on the map to set your <strong>{{ selectionMode }}</strong> point</span>
                </div>
              }

              <div class="map-legend">
                <div class="legend-item" matTooltip="Rider's start">
                  <span class="legend-marker origin">A</span>
                  <span class="legend-label">Origin</span>
                </div>
                <div class="legend-item" matTooltip="Rider's destination">
                  <span class="legend-marker dest">B</span>
                  <span class="legend-label">Destination</span>
                </div>
                @if (pickupLat) {
                  <div class="legend-item" matTooltip="Your pickup">
                    <span class="legend-marker pickup">P</span>
                    <span class="legend-label">Pickup</span>
                  </div>
                }
                @if (dropoffLat) {
                  <div class="legend-item" matTooltip="Your drop-off">
                    <span class="legend-marker dropoff">D</span>
                    <span class="legend-label">Drop-off</span>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
      }
    </div>

    <!-- Bottom Navigation -->
    <nav class="bottom-nav">
      <a class="nav-item" routerLink="/passenger">
        <mat-icon>home</mat-icon>
        <span>Home</span>
      </a>
      <a class="nav-item active" routerLink="/passenger/browse-rides">
        <mat-icon>search</mat-icon>
        <span>Find Ride</span>
      </a>
      <a class="nav-item" routerLink="/passenger/my-requests">
        <mat-icon>pending_actions</mat-icon>
        <span>Requests</span>
      </a>
      <a class="nav-item" (click)="goToProfile()">
        <mat-icon>person</mat-icon>
        <span>Profile</span>
      </a>
    </nav>
  `,
  styles: [`
    .page-container {
      min-height: 100vh;
      background: #f5f7fa;
    }

    /* Fixed Back Button */
    .back-btn-fixed {
      position: fixed;
      top: 16px;
      left: 16px;
      z-index: 1100;
      background: white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      color: #333;
    }

    .back-btn-fixed:hover {
      background: #f5f5f5;
    }

    /* Loading & Error States */
    .loading-container, .error-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 60vh;
      gap: 16px;
      color: #666;
    }

    .error-container mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #f44336;
    }

    .error-container h2 {
      margin: 0;
      color: #333;
    }

    /* Page Header */
    .page-header {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px 24px 16px 64px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .header-icon {
      width: 48px;
      height: 48px;
      background: rgba(255,255,255,0.2);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .header-icon mat-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    .header-text h1 {
      margin: 0;
      font-size: 22px;
      font-weight: 600;
    }

    .header-text p {
      margin: 4px 0 0;
      font-size: 14px;
      opacity: 0.9;
    }

    /* Content Wrapper */
    .content-wrapper {
      display: grid;
      grid-template-columns: 400px 1fr;
      gap: 24px;
      padding: 24px;
      padding-bottom: 100px;
      max-width: 1400px;
      margin: 0 auto;
    }

    /* Info Column */
    .info-column {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    /* Cards */
    mat-card {
      border-radius: 16px !important;
      box-shadow: 0 2px 12px rgba(0,0,0,0.08) !important;
    }

    mat-card-header {
      padding: 16px 16px 0;
    }

    mat-card-content {
      padding: 16px;
    }

    ::ng-deep .mat-mdc-card-avatar {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white !important;
      border-radius: 10px !important;
    }

    /* Ride Summary Card */
    .route-flow {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .route-point {
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }

    .point-marker {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 12px;
      color: white;
      flex-shrink: 0;
    }

    .point-marker.origin {
      background: linear-gradient(135deg, #4caf50, #2e7d32);
    }

    .point-marker.dest {
      background: linear-gradient(135deg, #f44336, #c62828);
    }

    .point-info {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .point-info .label {
      font-size: 11px;
      color: #999;
      text-transform: uppercase;
    }

    .point-info .address {
      font-size: 14px;
      color: #333;
      font-weight: 500;
    }

    .route-connector {
      display: flex;
      justify-content: center;
      padding-left: 4px;
      color: #ccc;
    }

    .route-connector mat-icon {
      font-size: 20px;
    }

    /* Rider Info Card */
    .rider-details {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    }

    .rider-avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: #e0e0e0;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .rider-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .rider-avatar mat-icon {
      font-size: 28px;
      color: #999;
    }

    .rider-info {
      flex: 1;
    }

    .rider-name {
      display: block;
      font-size: 16px;
      font-weight: 600;
      color: #333;
    }

    .rider-meta {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-top: 4px;
    }

    .rating {
      display: flex;
      align-items: center;
      gap: 4px;
      color: #ffc107;
      font-weight: 500;
      font-size: 13px;
    }

    .rating mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .rides {
      font-size: 12px;
      color: #666;
    }

    .ride-badges {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 6px 10px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
    }

    .badge mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .badge.time {
      background: #fff3e0;
      color: #ef6c00;
    }

    .badge.helmet {
      background: #e8f5e9;
      color: #2e7d32;
    }

    .badge.bike {
      background: #e3f2fd;
      color: #1565c0;
    }

    /* Selection Card */
    .mode-toggle {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
    }

    .mode-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 12px;
      border: 2px solid #e0e0e0;
      border-radius: 12px;
      background: white;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 14px;
      font-weight: 500;
      color: #666;
    }

    .mode-btn:hover {
      background: #f5f5f5;
    }

    .mode-btn.active.pickup {
      border-color: #9c27b0;
      background: #f3e5f5;
      color: #7b1fa2;
    }

    .mode-btn.active.dropoff {
      border-color: #ff9800;
      background: #fff3e0;
      color: #f57c00;
    }

    .mode-marker {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: bold;
      color: white;
    }

    .mode-marker.pickup {
      background: linear-gradient(135deg, #9c27b0, #7b1fa2);
    }

    .mode-marker.dropoff {
      background: linear-gradient(135deg, #ff9800, #f57c00);
    }

    .mode-btn .check {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #4caf50;
    }

    /* Point Input */
    .point-input {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px;
      border: 2px solid #e0e0e0;
      border-radius: 12px;
      margin-bottom: 12px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .point-input:hover {
      background: #fafafa;
    }

    .point-input.active {
      border-color: #667eea;
      background: #f8f9ff;
    }

    .point-badge {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 14px;
      color: white;
      flex-shrink: 0;
    }

    .point-badge.pickup {
      background: linear-gradient(135deg, #9c27b0, #7b1fa2);
    }

    .point-badge.dropoff {
      background: linear-gradient(135deg, #ff9800, #f57c00);
    }

    .input-wrapper {
      flex: 1;
      position: relative;
      min-width: 0;
    }

    .search-field {
      width: 100%;
    }

    ::ng-deep .search-field .mat-mdc-form-field-subscript-wrapper {
      display: none;
    }

    ::ng-deep .search-field input {
      font-size: 13px;
    }

    .search-results {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.15);
      max-height: 200px;
      overflow-y: auto;
      z-index: 1001;
    }

    .search-result-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 10px 12px;
      cursor: pointer;
      transition: background 0.2s;
      border-bottom: 1px solid #f0f0f0;
    }

    .search-result-item:last-child {
      border-bottom: none;
    }

    .search-result-item:hover {
      background: #f5f5f5;
    }

    .search-result-item mat-icon {
      color: #1976d2;
      font-size: 20px;
      margin-top: 2px;
    }

    .result-text {
      flex: 1;
      min-width: 0;
    }

    .result-text .name {
      display: block;
      font-size: 13px;
      font-weight: 500;
      color: #333;
    }

    .result-text .address {
      display: block;
      font-size: 11px;
      color: #666;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .search-loading {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 12px;
      color: #666;
      font-size: 12px;
    }

    .selected-badge {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      background: #e8f5e9;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 500;
      color: #2e7d32;
    }

    .selected-badge mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .reset-btn {
      width: 100%;
      color: #666;
    }

    /* Message Card */
    .message-field {
      width: 100%;
    }

    /* Action Buttons */
    .action-buttons {
      display: flex;
      gap: 12px;
      padding-top: 8px;
    }

    .cancel-btn {
      flex: 1;
    }

    .send-btn {
      flex: 2;
      height: 48px;
      border-radius: 24px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-weight: 500;
      transition: all 0.3s;
    }

    .send-btn:disabled {
      background: #e0e0e0;
      color: #999;
    }

    .send-btn.ready:not(:disabled) {
      background: linear-gradient(135deg, #43a047, #2e7d32);
      box-shadow: 0 4px 16px rgba(46, 125, 50, 0.3);
    }

    .send-btn.ready:not(:disabled):hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(46, 125, 50, 0.4);
    }

    /* Map Column */
    .map-column {
      position: sticky;
      top: 24px;
      height: calc(100vh - 120px);
    }

    .map-wrapper {
      position: relative;
      height: 100%;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    }

    .map-container {
      height: 100%;
      width: 100%;
    }

    .route-loading-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.85);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      z-index: 1001;
    }

    .route-loading-overlay span {
      color: #1976d2;
      font-weight: 500;
      font-size: 14px;
    }

    .floating-instruction {
      position: absolute;
      top: 16px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0,0,0,0.8);
      color: white;
      padding: 12px 24px;
      border-radius: 24px;
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 14px;
      z-index: 1000;
      pointer-events: none;
    }

    .floating-instruction mat-icon {
      font-size: 22px;
    }

    .map-legend {
      position: absolute;
      bottom: 16px;
      left: 16px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      z-index: 1000;
      background: rgba(255,255,255,0.95);
      padding: 12px;
      border-radius: 12px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.15);
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .legend-marker {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: bold;
      color: white;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }

    .legend-marker.origin { background: linear-gradient(135deg, #4caf50, #2e7d32); }
    .legend-marker.dest { background: linear-gradient(135deg, #f44336, #c62828); }
    .legend-marker.pickup { background: linear-gradient(135deg, #9c27b0, #7b1fa2); }
    .legend-marker.dropoff { background: linear-gradient(135deg, #ff9800, #f57c00); }

    .legend-label {
      font-size: 12px;
      color: #666;
    }

    /* Responsive */
    @media (max-width: 900px) {
      .content-wrapper {
        grid-template-columns: 1fr;
        padding: 16px;
        padding-bottom: 100px;
      }

      .map-column {
        position: relative;
        top: 0;
        height: 400px;
        order: -1;
      }

      .page-header {
        padding: 12px 16px 12px 56px;
      }

      .header-icon {
        display: none;
      }

      .header-text h1 {
        font-size: 18px;
      }

      .back-btn-fixed {
        top: 12px;
        left: 12px;
      }
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
      border-top: 1px solid #eee;
      padding: 8px 0;
      padding-bottom: max(8px, env(safe-area-inset-bottom));
      z-index: 100;
    }

    .nav-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      padding: 6px 16px;
      color: #999;
      text-decoration: none;
      font-size: 11px;
      cursor: pointer;
      transition: color 0.2s;
    }

    .nav-item mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .nav-item.active {
      color: #667eea;
    }
  `]
})
export class RequestRideComponent implements OnInit, AfterViewInit, OnDestroy {
  rideId: string = '';
  ride: Ride | null = null;
  loading = true;
  error: string | null = null;
  
  message = '';
  pickupLocation = '';
  dropoffLocation = '';
  pickupLat?: number;
  pickupLng?: number;
  dropoffLat?: number;
  dropoffLng?: number;
  selectionMode: 'pickup' | 'dropoff' = 'pickup';
  sending = false;
  routeLoading = false;
  
  // Search-related
  pickupSearchQuery = '';
  dropoffSearchQuery = '';
  pickupSearchResults: any[] = [];
  dropoffSearchResults: any[] = [];
  showPickupResults = false;
  showDropoffResults = false;
  pickupSearching = false;
  dropoffSearching = false;
  private searchDebounceTimer: any;
  
  private map: L.Map | null = null;
  private pickupMarker: L.Marker | null = null;
  private dropoffMarker: L.Marker | null = null;
  private routeLine?: L.Polyline;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private rideService: RideService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.rideId = this.route.snapshot.paramMap.get('id') || '';
    if (this.rideId) {
      this.loadRide();
    } else {
      this.error = 'No ride ID provided';
      this.loading = false;
    }
  }

  ngAfterViewInit(): void {
    // Map will be initialized after ride is loaded
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }
  }

  private loadRide(): void {
    this.loading = true;
    this.rideService.getRide(this.rideId).subscribe({
      next: (ride) => {
        this.ride = ride;
        this.loading = false;
        setTimeout(() => this.initMap(), 100);
      },
      error: () => {
        this.error = 'Could not load ride details';
        this.loading = false;
      }
    });
  }

  private initMap(): void {
    if (!this.ride) return;

    let centerLat = 23.8103;
    let centerLng = 90.4125;
    
    if (this.ride.originLat && this.ride.originLng) {
      centerLat = this.ride.originLat;
      centerLng = this.ride.originLng;
    }

    this.map = L.map('request-map', {
      zoomControl: true,
      attributionControl: false
    }).setView([centerLat, centerLng], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: ''
    }).addTo(this.map);

    this.addMarkerStyles();

    // Add rider's origin marker (A)
    if (this.ride.originLat && this.ride.originLng) {
      const originIcon = L.divIcon({
        className: 'custom-marker origin-marker',
        html: `<div class="marker-circle origin-circle"><span>A</span></div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });
      L.marker([this.ride.originLat, this.ride.originLng], { icon: originIcon })
        .addTo(this.map)
        .bindPopup(`<strong>Rider's Start (A):</strong><br>${this.ride.origin}`);
    }

    // Add rider's destination marker (B)
    if (this.ride.destLat && this.ride.destLng) {
      const destIcon = L.divIcon({
        className: 'custom-marker dest-marker',
        html: `<div class="marker-circle dest-circle"><span>B</span></div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });
      L.marker([this.ride.destLat, this.ride.destLng], { icon: destIcon })
        .addTo(this.map)
        .bindPopup(`<strong>Rider's End (B):</strong><br>${this.ride.destination}`);
    }

    // Draw route
    if (this.ride.originLat && this.ride.originLng && this.ride.destLat && this.ride.destLng) {
      this.fetchAndDrawRoute(this.ride.originLat, this.ride.originLng, this.ride.destLat, this.ride.destLng);
    }

    // Handle map clicks
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.handleMapClick(e.latlng);
    });
  }

  private addMarkerStyles(): void {
    const styleId = 'request-map-marker-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .marker-circle {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 14px;
        color: white;
        border: 3px solid white;
        box-shadow: 0 3px 10px rgba(0,0,0,0.3);
      }
      .origin-circle { background: linear-gradient(135deg, #4caf50 0%, #2e7d32 100%); }
      .dest-circle { background: linear-gradient(135deg, #f44336 0%, #c62828 100%); }
      .pickup-circle { background: linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%); }
      .dropoff-circle { background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); }
    `;
    document.head.appendChild(style);
  }

  private fetchAndDrawRoute(originLat: number, originLng: number, destLat: number, destLng: number): void {
    if (!this.map) return;

    this.routeLoading = true;

    if (this.routeLine) {
      this.map.removeLayer(this.routeLine);
    }

    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${destLng},${destLat}?overview=full&geometries=geojson`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    fetch(osrmUrl, { signal: controller.signal })
      .then(response => {
        clearTimeout(timeoutId);
        return response.json();
      })
      .then(data => {
        this.routeLoading = false;
        if (data.code === 'Ok' && data.routes?.length > 0) {
          const coordinates = data.routes[0].geometry.coordinates;
          const latLngs: L.LatLngExpression[] = coordinates.map((coord: number[]) => [coord[1], coord[0]]);

          this.routeLine = L.polyline(latLngs, {
            color: '#1976d2',
            weight: 5,
            opacity: 0.8,
            lineCap: 'round',
            lineJoin: 'round'
          }).addTo(this.map!);

          this.map!.fitBounds(this.routeLine.getBounds(), { padding: [50, 50] });
        } else {
          this.drawFallbackLine(originLat, originLng, destLat, destLng);
        }
      })
      .catch(() => {
        clearTimeout(timeoutId);
        this.routeLoading = false;
        this.drawFallbackLine(originLat, originLng, destLat, destLng);
      });
  }

  private drawFallbackLine(originLat: number, originLng: number, destLat: number, destLng: number): void {
    if (!this.map) return;

    this.routeLine = L.polyline([
      [originLat, originLng],
      [destLat, destLng]
    ], { 
      color: '#1976d2', 
      weight: 4, 
      opacity: 0.6, 
      dashArray: '10, 10',
      lineCap: 'round'
    }).addTo(this.map);

    this.map.fitBounds(this.routeLine.getBounds(), { padding: [50, 50] });
  }

  private handleMapClick(latlng: L.LatLng): void {
    if (!this.map) return;

    if (this.selectionMode === 'pickup') {
      this.pickupLat = latlng.lat;
      this.pickupLng = latlng.lng;
      this.pickupLocation = `${latlng.lat.toFixed(5)}, ${latlng.lng.toFixed(5)}`;

      if (this.pickupMarker) {
        this.map.removeLayer(this.pickupMarker);
      }

      const pickupIcon = L.divIcon({
        className: 'custom-marker pickup-marker',
        html: `<div class="marker-circle pickup-circle"><span>P</span></div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });
      this.pickupMarker = L.marker([latlng.lat, latlng.lng], { 
        icon: pickupIcon,
        draggable: true 
      }).addTo(this.map)
        .bindPopup('<strong>Your Pickup Point (P)</strong><br>Drag to adjust');

      this.pickupMarker.on('dragend', (e: L.LeafletEvent) => {
        const marker = e.target as L.Marker;
        const pos = marker.getLatLng();
        this.pickupLat = pos.lat;
        this.pickupLng = pos.lng;
        this.pickupLocation = `${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}`;
        this.updateFullRouteIfReady();
      });

      this.snackBar.open('Pickup point set! Now set your drop-off.', 'OK', { duration: 2500 });
      this.selectionMode = 'dropoff';
      this.updateFullRouteIfReady();
    } else {
      this.dropoffLat = latlng.lat;
      this.dropoffLng = latlng.lng;
      this.dropoffLocation = `${latlng.lat.toFixed(5)}, ${latlng.lng.toFixed(5)}`;

      if (this.dropoffMarker) {
        this.map.removeLayer(this.dropoffMarker);
      }

      const dropoffIcon = L.divIcon({
        className: 'custom-marker dropoff-marker',
        html: `<div class="marker-circle dropoff-circle"><span>D</span></div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });
      this.dropoffMarker = L.marker([latlng.lat, latlng.lng], { 
        icon: dropoffIcon,
        draggable: true 
      }).addTo(this.map)
        .bindPopup('<strong>Your Drop-off Point (D)</strong><br>Drag to adjust');

      this.dropoffMarker.on('dragend', (e: L.LeafletEvent) => {
        const marker = e.target as L.Marker;
        const pos = marker.getLatLng();
        this.dropoffLat = pos.lat;
        this.dropoffLng = pos.lng;
        this.dropoffLocation = `${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}`;
        this.updateFullRouteIfReady();
      });

      this.snackBar.open('Drop-off point set! Ready to send request.', 'OK', { duration: 2500 });
      this.updateFullRouteIfReady();
    }
  }

  private updateFullRouteIfReady(): void {
    if (!this.ride) return;
    
    if (this.pickupLat && this.pickupLng && this.dropoffLat && this.dropoffLng &&
        this.ride.originLat && this.ride.originLng && this.ride.destLat && this.ride.destLng) {
      this.fetchAndDrawFullRoute(
        this.ride.originLat, this.ride.originLng,
        this.pickupLat, this.pickupLng,
        this.dropoffLat, this.dropoffLng,
        this.ride.destLat, this.ride.destLng
      );
    }
  }

  private fetchAndDrawFullRoute(
    aLat: number, aLng: number,
    pLat: number, pLng: number,
    dLat: number, dLng: number,
    bLat: number, bLng: number
  ): void {
    if (!this.map) return;

    this.routeLoading = true;

    if (this.routeLine) {
      this.map.removeLayer(this.routeLine);
    }

    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${aLng},${aLat};${pLng},${pLat};${dLng},${dLat};${bLng},${bLat}?overview=full&geometries=geojson`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    fetch(osrmUrl, { signal: controller.signal })
      .then(response => {
        clearTimeout(timeoutId);
        return response.json();
      })
      .then(data => {
        this.routeLoading = false;
        if (data.code === 'Ok' && data.routes?.length > 0) {
          const coordinates = data.routes[0].geometry.coordinates;
          const latLngs: L.LatLngExpression[] = coordinates.map((coord: number[]) => [coord[1], coord[0]]);

          this.routeLine = L.polyline(latLngs, {
            color: '#1976d2',
            weight: 5,
            opacity: 0.8,
            lineCap: 'round',
            lineJoin: 'round'
          }).addTo(this.map!);

          this.map!.fitBounds(this.routeLine.getBounds(), { padding: [50, 50] });
        } else {
          this.drawFallbackFullRoute(aLat, aLng, pLat, pLng, dLat, dLng, bLat, bLng);
        }
      })
      .catch(() => {
        clearTimeout(timeoutId);
        this.routeLoading = false;
        this.drawFallbackFullRoute(aLat, aLng, pLat, pLng, dLat, dLng, bLat, bLng);
      });
  }

  private drawFallbackFullRoute(
    aLat: number, aLng: number,
    pLat: number, pLng: number,
    dLat: number, dLng: number,
    bLat: number, bLng: number
  ): void {
    if (!this.map) return;

    if (this.routeLine) {
      this.map.removeLayer(this.routeLine);
    }

    this.routeLine = L.polyline([
      [aLat, aLng],
      [pLat, pLng],
      [dLat, dLng],
      [bLat, bLng]
    ], { 
      color: '#1976d2', 
      weight: 4, 
      opacity: 0.6, 
      dashArray: '10, 10',
      lineCap: 'round'
    }).addTo(this.map);

    this.map.fitBounds(this.routeLine.getBounds(), { padding: [50, 50] });
  }

  private restoreOriginalRoute(): void {
    if (!this.ride) return;
    if (this.ride.originLat && this.ride.originLng && this.ride.destLat && this.ride.destLng) {
      this.fetchAndDrawRoute(this.ride.originLat, this.ride.originLng, this.ride.destLat, this.ride.destLng);
    }
  }

  // Search methods
  onSearchInput(type: 'pickup' | 'dropoff'): void {
    const query = type === 'pickup' ? this.pickupSearchQuery : this.dropoffSearchQuery;
    
    if (type === 'pickup') {
      this.showPickupResults = true;
    } else {
      this.showDropoffResults = true;
    }
    
    this.searchLocation(query, type);
  }

  private searchLocation(query: string, type: 'pickup' | 'dropoff'): void {
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }

    if (!query || query.length < 2) {
      if (type === 'pickup') {
        this.pickupSearchResults = [];
        this.pickupSearching = false;
      } else {
        this.dropoffSearchResults = [];
        this.dropoffSearching = false;
      }
      return;
    }

    if (type === 'pickup') {
      this.pickupSearching = true;
    } else {
      this.dropoffSearching = true;
    }

    this.searchDebounceTimer = setTimeout(() => {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=bd`;
      
      fetch(url, { headers: { 'Accept': 'application/json' } })
        .then(response => response.json())
        .then(results => {
          if (type === 'pickup') {
            this.pickupSearchResults = results;
            this.pickupSearching = false;
          } else {
            this.dropoffSearchResults = results;
            this.dropoffSearching = false;
          }
        })
        .catch(() => {
          if (type === 'pickup') {
            this.pickupSearchResults = [];
            this.pickupSearching = false;
          } else {
            this.dropoffSearchResults = [];
            this.dropoffSearching = false;
          }
        });
    }, 400);
  }

  selectSearchResult(result: any, type: 'pickup' | 'dropoff', event: Event): void {
    event.preventDefault();
    
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    const location = result.display_name;
    const shortName = this.getShortDisplayName(location);

    if (type === 'pickup') {
      this.pickupLocation = location;
      this.pickupSearchQuery = shortName;
      this.pickupLat = lat;
      this.pickupLng = lng;
      this.showPickupResults = false;
      this.pickupSearchResults = [];
      this.selectionMode = 'dropoff';
      this.snackBar.open('Pickup location set!', 'OK', { duration: 2000 });
    } else {
      this.dropoffLocation = location;
      this.dropoffSearchQuery = shortName;
      this.dropoffLat = lat;
      this.dropoffLng = lng;
      this.showDropoffResults = false;
      this.dropoffSearchResults = [];
      this.snackBar.open('Drop-off location set!', 'OK', { duration: 2000 });
    }

    if (this.map) {
      this.updateMarkerFromSearch(lat, lng, type);
      this.updateFullRouteIfReady();
    }
  }

  private updateMarkerFromSearch(lat: number, lng: number, type: 'pickup' | 'dropoff'): void {
    if (!this.map) return;

    if (type === 'pickup') {
      if (this.pickupMarker) {
        this.map.removeLayer(this.pickupMarker);
      }
      const pickupIcon = L.divIcon({
        className: 'custom-marker pickup-marker',
        html: `<div class="marker-circle pickup-circle"><span>P</span></div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });
      this.pickupMarker = L.marker([lat, lng], { icon: pickupIcon, draggable: true })
        .addTo(this.map)
        .bindPopup('<strong>Your Pickup Point (P)</strong><br>Drag to adjust');
      
      this.pickupMarker.on('dragend', (e: L.LeafletEvent) => {
        const marker = e.target as L.Marker;
        const pos = marker.getLatLng();
        this.pickupLat = pos.lat;
        this.pickupLng = pos.lng;
        this.updateFullRouteIfReady();
      });
    } else {
      if (this.dropoffMarker) {
        this.map.removeLayer(this.dropoffMarker);
      }
      const dropoffIcon = L.divIcon({
        className: 'custom-marker dropoff-marker',
        html: `<div class="marker-circle dropoff-circle"><span>D</span></div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });
      this.dropoffMarker = L.marker([lat, lng], { icon: dropoffIcon, draggable: true })
        .addTo(this.map)
        .bindPopup('<strong>Your Drop-off Point (D)</strong><br>Drag to adjust');
      
      this.dropoffMarker.on('dragend', (e: L.LeafletEvent) => {
        const marker = e.target as L.Marker;
        const pos = marker.getLatLng();
        this.dropoffLat = pos.lat;
        this.dropoffLng = pos.lng;
        this.updateFullRouteIfReady();
      });
    }

    this.map.panTo([lat, lng]);
  }

  onSearchFocus(type: 'pickup' | 'dropoff'): void {
    if (type === 'pickup' && this.pickupSearchResults.length > 0) {
      this.showPickupResults = true;
    } else if (type === 'dropoff' && this.dropoffSearchResults.length > 0) {
      this.showDropoffResults = true;
    }
  }

  onSearchBlur(type: 'pickup' | 'dropoff'): void {
    setTimeout(() => {
      if (type === 'pickup') {
        this.showPickupResults = false;
      } else {
        this.showDropoffResults = false;
      }
    }, 200);
  }

  clearSearch(type: 'pickup' | 'dropoff', event: Event): void {
    event.stopPropagation();
    if (type === 'pickup') {
      this.pickupSearchQuery = '';
      this.pickupSearchResults = [];
      this.showPickupResults = false;
      this.clearPoint('pickup');
    } else {
      this.dropoffSearchQuery = '';
      this.dropoffSearchResults = [];
      this.showDropoffResults = false;
      this.clearPoint('dropoff');
    }
  }

  private clearPoint(type: 'pickup' | 'dropoff'): void {
    if (type === 'pickup') {
      if (this.pickupMarker && this.map) {
        this.map.removeLayer(this.pickupMarker);
      }
      this.pickupMarker = null;
      this.pickupLat = undefined;
      this.pickupLng = undefined;
      this.pickupLocation = '';
      this.selectionMode = 'pickup';
    } else {
      if (this.dropoffMarker && this.map) {
        this.map.removeLayer(this.dropoffMarker);
      }
      this.dropoffMarker = null;
      this.dropoffLat = undefined;
      this.dropoffLng = undefined;
      this.dropoffLocation = '';
    }
    this.restoreOriginalRoute();
  }

  resetPoints(): void {
    this.clearPoint('pickup');
    this.clearPoint('dropoff');
    this.pickupSearchQuery = '';
    this.dropoffSearchQuery = '';
    this.selectionMode = 'pickup';
    this.snackBar.open('Points cleared. Start over.', 'OK', { duration: 1500 });
  }

  // Utility methods
  getShortDisplayName(displayName: string): string {
    if (!displayName) return '';
    const parts = displayName.split(',');
    return parts.slice(0, 2).join(', ').trim();
  }

  formatDateTime(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  isValid(): boolean {
    return !!(this.pickupLocation || (this.pickupLat && this.pickupLng));
  }

  sendRequest(): void {
    this.sending = true;
    this.rideService.requestToJoin(this.rideId, {
      message: this.message || undefined,
      pickupLocation: this.pickupLocation || undefined,
      pickupLat: this.pickupLat,
      pickupLng: this.pickupLng,
      dropoffLocation: this.dropoffLocation || undefined,
      dropoffLat: this.dropoffLat,
      dropoffLng: this.dropoffLng
    }).subscribe({
      next: () => {
        this.sending = false;
        this.snackBar.open('Request sent! The rider will review your request.', 'Close', { duration: 4000 });
        this.router.navigate(['/passenger/my-requests']);
      },
      error: (err) => {
        this.sending = false;
        const message = err.error?.message || 'Failed to send request. You may have already requested this ride.';
        this.snackBar.open(message, 'Close', { duration: 4000 });
      }
    });
  }

  goBack(): void {
    this.location.back();
  }

  goToProfile(): void {
    this.router.navigate(['/passenger'], { queryParams: { tab: 'profile' } });
  }
}
