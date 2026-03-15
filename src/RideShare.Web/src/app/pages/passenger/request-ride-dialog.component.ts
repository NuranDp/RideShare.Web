import { Component, Inject, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatStepperModule } from '@angular/material/stepper';
import { MatDividerModule } from '@angular/material/divider';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { RideService } from '../../services/ride.service';
import { RideListItem } from '../../models/ride.model';
import * as L from 'leaflet';

@Component({
  selector: 'app-request-ride-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatStepperModule,
    MatDividerModule
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
    <!-- Modern Header -->
    <div class="dialog-header">
      <div class="header-content">
        <div class="header-icon">
          <mat-icon>two_wheeler</mat-icon>
        </div>
        <div class="header-text">
          <h2>Request to Join Ride</h2>
          <p>Select your pickup & drop-off points on the map</p>
        </div>
      </div>
      <button mat-icon-button class="close-btn" (click)="cancel()" [disabled]="sending">
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <mat-dialog-content>
      <!-- Compact Ride Summary -->
      <div class="ride-summary-banner">
        <div class="route-flow">
          <div class="route-point origin">
            <mat-icon>trip_origin</mat-icon>
            <span>{{ getShortAddress(data.ride.origin) }}</span>
          </div>
          <div class="route-arrow">
            <mat-icon>arrow_forward</mat-icon>
          </div>
          <div class="route-point destination">
            <mat-icon>place</mat-icon>
            <span>{{ getShortAddress(data.ride.destination) }}</span>
          </div>
        </div>
        <div class="ride-quick-info">
          <span class="info-badge rider">
            <mat-icon>person</mat-icon>
            {{ data.ride.riderName }}
          </span>
          <span class="info-badge time">
            <mat-icon>schedule</mat-icon>
            {{ formatShortDateTime(data.ride.departureTime) }}
          </span>
          @if (data.ride.helmetProvided) {
            <span class="info-badge helmet">
              <mat-icon>sports_motorsports</mat-icon>
              Helmet
            </span>
          }
        </div>
      </div>

      <!-- Progress Steps -->
      <div class="progress-steps">
        <div class="step" 
             [class.active]="selectionMode === 'pickup' && !pickupLat"
             [class.completed]="pickupLat"
             (click)="selectionMode = 'pickup'">
          <div class="step-indicator">
            @if (pickupLat) {
              <mat-icon class="check-icon">check_circle</mat-icon>
            } @else {
              <span class="step-num">1</span>
            }
          </div>
          <span class="step-label">Pickup</span>
        </div>
        <div class="progress-line" [class.filled]="pickupLat"></div>
        <div class="step" 
             [class.active]="selectionMode === 'dropoff' && !dropoffLat"
             [class.completed]="dropoffLat"
             (click)="selectionMode = 'dropoff'">
          <div class="step-indicator">
            @if (dropoffLat) {
              <mat-icon class="check-icon">check_circle</mat-icon>
            } @else {
              <span class="step-num">2</span>
            }
          </div>
          <span class="step-label">Drop-off</span>
        </div>
        <div class="progress-line" [class.filled]="dropoffLat"></div>
        <div class="step" 
             [class.active]="pickupLat && dropoffLat"
             [class.completed]="false">
          <div class="step-indicator">
            <span class="step-num">3</span>
          </div>
          <span class="step-label">Confirm</span>
        </div>
      </div>

      <!-- Map Section -->
      <div class="map-section">
        <!-- Mode Toggle with Instructions -->
        <div class="map-header">
          <div class="mode-toggle">
            <button class="mode-btn pickup" 
                    [class.active]="selectionMode === 'pickup'"
                    (click)="selectionMode = 'pickup'">
              <mat-icon>trip_origin</mat-icon>
              <span>Pickup</span>
              @if (pickupLat) {
                <mat-icon class="set-icon">check</mat-icon>
              }
            </button>
            <button class="mode-btn dropoff" 
                    [class.active]="selectionMode === 'dropoff'"
                    (click)="selectionMode = 'dropoff'">
              <mat-icon>flag</mat-icon>
              <span>Drop-off</span>
              @if (dropoffLat) {
                <mat-icon class="set-icon">check</mat-icon>
              }
            </button>
          </div>
          @if (pickupLat || dropoffLat) {
            <button mat-icon-button 
                    class="reset-btn"
                    matTooltip="Reset all points"
                    (click)="resetPoints()">
              <mat-icon>refresh</mat-icon>
            </button>
          }
        </div>

        <!-- Map Container -->
        <div class="map-wrapper">
          <div id="request-map" class="map-container"></div>
          
          <!-- Route Loading Overlay -->
          @if (routeLoading) {
            <div class="route-loading-overlay">
              <mat-spinner diameter="36"></mat-spinner>
              <span>Calculating route...</span>
            </div>
          }
          
          <!-- Floating instruction -->
          @if (!pickupLat && !dropoffLat) {
            <div class="floating-instruction" @fadeSlide>
              <mat-icon>touch_app</mat-icon>
              <span>Tap on the map to set your <strong>{{ selectionMode }}</strong> point</span>
            </div>
          }

          <!-- Compact Legend -->
          <div class="map-legend">
            <div class="legend-item" matTooltip="Rider's start">
              <span class="legend-marker origin">A</span>
            </div>
            <div class="legend-item" matTooltip="Rider's destination">
              <span class="legend-marker dest">B</span>
            </div>
            @if (pickupLat) {
              <div class="legend-item" matTooltip="Your pickup">
                <span class="legend-marker pickup">P</span>
              </div>
            }
            @if (dropoffLat) {
              <div class="legend-item" matTooltip="Your drop-off">
                <span class="legend-marker dropoff">D</span>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Selected Points Cards -->
      <div class="points-section">
        <div class="point-card pickup" 
             [class.set]="pickupLat" 
             [class.editing]="selectionMode === 'pickup'"
             (click)="selectionMode = 'pickup'">
          <div class="point-header">
            <div class="point-badge pickup">
              <span>P</span>
            </div>
            <div class="point-details">
              <span class="point-label">Pickup Point</span>
              @if (pickupLat) {
                <span class="point-status set">
                  <mat-icon>check_circle</mat-icon>
                  Location set
                </span>
              } @else {
                <span class="point-status pending">Search or tap map</span>
              }
            </div>
            @if (pickupLat) {
              <button mat-icon-button 
                      class="clear-btn" 
                      (click)="clearPickup($event)"
                      matTooltip="Clear">
                <mat-icon>close</mat-icon>
              </button>
            }
          </div>
          <!-- Search Input -->
          <div class="search-input-wrapper" (click)="$event.stopPropagation()">
            <mat-form-field appearance="outline" class="search-field">
              <mat-icon matPrefix class="search-icon">search</mat-icon>
              <input matInput 
                     [(ngModel)]="pickupSearchQuery"
                     (input)="onPickupSearchInput($event)"
                     (focus)="onSearchFocus('pickup')"
                     (blur)="onSearchBlur('pickup')"
                     placeholder="Search location...">
              @if (pickupSearchQuery) {
                <button mat-icon-button matSuffix (click)="clearPickupSearch($event)">
                  <mat-icon>close</mat-icon>
                </button>
              }
            </mat-form-field>
            @if (showPickupResults && pickupSearchResults.length > 0) {
              <div class="search-results">
                @for (result of pickupSearchResults; track result.place_id) {
                  <div class="search-result-item" (mousedown)="$event.preventDefault(); selectPickupResult(result)">
                    <mat-icon class="result-icon">place</mat-icon>
                    <div class="result-text">
                      <span class="result-name">{{ result.display_name.split(',')[0] }}</span>
                      <span class="result-address">{{ getShortDisplayName(result.display_name) }}</span>
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
            <div class="selected-location">
              <mat-icon>check_circle</mat-icon>
              <span>{{ pickupLocation }}</span>
            </div>
          }
        </div>

        <div class="point-card dropoff" 
             [class.set]="dropoffLat" 
             [class.editing]="selectionMode === 'dropoff'"
             (click)="selectionMode = 'dropoff'">
          <div class="point-header">
            <div class="point-badge dropoff">
              <span>D</span>
            </div>
            <div class="point-details">
              <span class="point-label">Drop-off Point</span>
              @if (dropoffLat) {
                <span class="point-status set">
                  <mat-icon>check_circle</mat-icon>
                  Location set
                </span>
              } @else {
                <span class="point-status pending">Search or tap map</span>
              }
            </div>
            @if (dropoffLat) {
              <button mat-icon-button 
                      class="clear-btn" 
                      (click)="clearDropoff($event)"
                      matTooltip="Clear">
                <mat-icon>close</mat-icon>
              </button>
            }
          </div>
          <!-- Search Input -->
          <div class="search-input-wrapper" (click)="$event.stopPropagation()">
            <mat-form-field appearance="outline" class="search-field">
              <mat-icon matPrefix class="search-icon">search</mat-icon>
              <input matInput 
                     [(ngModel)]="dropoffSearchQuery"
                     (input)="onDropoffSearchInput($event)"
                     (focus)="onSearchFocus('dropoff')"
                     (blur)="onSearchBlur('dropoff')"
                     placeholder="Search location...">
              @if (dropoffSearchQuery) {
                <button mat-icon-button matSuffix (click)="clearDropoffSearch($event)">
                  <mat-icon>close</mat-icon>
                </button>
              }
            </mat-form-field>
            @if (showDropoffResults && dropoffSearchResults.length > 0) {
              <div class="search-results">
                @for (result of dropoffSearchResults; track result.place_id) {
                  <div class="search-result-item" (mousedown)="$event.preventDefault(); selectDropoffResult(result)">
                    <mat-icon class="result-icon">place</mat-icon>
                    <div class="result-text">
                      <span class="result-name">{{ result.display_name.split(',')[0] }}</span>
                      <span class="result-address">{{ getShortDisplayName(result.display_name) }}</span>
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
            <div class="selected-location">
              <mat-icon>check_circle</mat-icon>
              <span>{{ dropoffLocation }}</span>
            </div>
          }
        </div>
      </div>

      <!-- Message Section -->
      <div class="message-section">
        <div class="section-label">
          <mat-icon>chat_bubble_outline</mat-icon>
          <span>Message to Rider</span>
          <span class="optional-tag">Optional</span>
        </div>
        <mat-form-field appearance="outline" class="message-field">
          <textarea matInput 
                    [(ngModel)]="message" 
                    rows="2"
                    placeholder="Introduce yourself or add any notes for the rider..."></textarea>
          <mat-hint align="end">{{ message.length }}/200</mat-hint>
        </mat-form-field>
      </div>

      <!-- Ready State Summary -->
      @if (isValid()) {
        <div class="ready-summary" @scaleIn>
          <mat-icon class="ready-icon">rocket_launch</mat-icon>
          <div class="ready-text">
            <strong>Ready to send!</strong>
            <span>The rider will be notified of your request.</span>
          </div>
        </div>
      }
    </mat-dialog-content>

    <!-- Action Footer -->
    <mat-dialog-actions>
      <button mat-button class="cancel-btn" (click)="cancel()" [disabled]="sending">
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
    </mat-dialog-actions>
  `,
  styles: [`
    /* Dialog Header */
    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 20px 24px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .header-content {
      display: flex;
      gap: 16px;
      align-items: center;
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

    .header-text h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
    }

    .header-text p {
      margin: 4px 0 0;
      font-size: 13px;
      opacity: 0.9;
    }

    .close-btn {
      color: white;
      opacity: 0.8;
      transition: opacity 0.2s;
    }

    .close-btn:hover {
      opacity: 1;
    }

    /* Dialog Content */
    mat-dialog-content {
      padding: 24px 28px !important;
      min-width: 600px;
      max-height: 75vh;
      overflow-y: auto;
    }

    /* Ride Summary Banner */
    .ride-summary-banner {
      background: #f8f9fa;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 20px;
      border: 1px solid #e9ecef;
    }

    .route-flow {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    }

    .route-point {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 14px;
      font-weight: 500;
      color: #333;
      flex: 1;
      min-width: 0;
    }

    .route-point span {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .route-point.origin mat-icon {
      color: #4caf50;
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .route-point.destination mat-icon {
      color: #f44336;
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .route-arrow {
      color: #9e9e9e;
      flex-shrink: 0;
    }

    .route-arrow mat-icon {
      font-size: 20px;
    }

    .ride-quick-info {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .info-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 500;
    }

    .info-badge mat-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }

    .info-badge.rider {
      background: #e3f2fd;
      color: #1565c0;
    }

    .info-badge.time {
      background: #fff3e0;
      color: #ef6c00;
    }

    .info-badge.helmet {
      background: #e8f5e9;
      color: #2e7d32;
    }

    /* Progress Steps */
    .progress-steps {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px 0;
      margin-bottom: 16px;
    }

    .step {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .step-indicator {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #e0e0e0;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s;
    }

    .step-num {
      font-size: 14px;
      font-weight: 600;
      color: #999;
    }

    .step.active .step-indicator {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }

    .step.active .step-num {
      color: white;
    }

    .step.completed .step-indicator {
      background: #4caf50;
    }

    .check-icon {
      color: white;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .step-label {
      font-size: 11px;
      font-weight: 500;
      color: #999;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .step.active .step-label,
    .step.completed .step-label {
      color: #333;
    }

    .progress-line {
      width: 48px;
      height: 3px;
      background: #e0e0e0;
      border-radius: 2px;
      margin: 0 8px;
      margin-bottom: 22px;
      transition: background 0.3s;
    }

    .progress-line.filled {
      background: linear-gradient(90deg, #4caf50, #81c784);
    }

    /* Map Section */
    .map-section {
      margin-bottom: 20px;
    }

    .map-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .mode-toggle {
      display: flex;
      gap: 8px;
    }

    .mode-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border: 2px solid #e0e0e0;
      border-radius: 20px;
      background: white;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 13px;
      font-weight: 500;
      color: #666;
    }

    .mode-btn mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .mode-btn.pickup.active {
      border-color: #4caf50;
      background: #e8f5e9;
      color: #2e7d32;
    }

    .mode-btn.dropoff.active {
      border-color: #f44336;
      background: #ffebee;
      color: #c62828;
    }

    .set-icon {
      font-size: 16px !important;
      width: 16px !important;
      height: 16px !important;
      margin-left: 4px;
    }

    .reset-btn {
      color: #666;
    }

    .map-wrapper {
      position: relative;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 2px 12px rgba(0,0,0,0.1);
    }

    .map-container {
      height: 300px;
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
      padding: 10px 20px;
      border-radius: 24px;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      z-index: 1000;
      pointer-events: none;
    }

    .floating-instruction mat-icon {
      font-size: 20px;
    }

    .map-legend {
      position: absolute;
      bottom: 12px;
      right: 12px;
      display: flex;
      gap: 8px;
      z-index: 1000;
      background: rgba(255,255,255,0.95);
      padding: 6px 10px;
      border-radius: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    }

    .legend-item {
      display: flex;
      align-items: center;
      cursor: help;
    }

    .legend-marker {
      width: 22px;
      height: 22px;
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

    /* Points Section */
    .points-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 20px;
    }

    /* Search Input Styles */
    .search-input-wrapper {
      position: relative;
      margin-top: 8px;
    }

    .search-field {
      width: 100%;
    }

    ::ng-deep .search-field .mat-mdc-form-field-subscript-wrapper {
      display: none;
    }

    ::ng-deep .search-field .mat-mdc-text-field-wrapper {
      padding: 0 12px;
    }

    ::ng-deep .search-field input {
      font-size: 13px;
    }

    .search-icon {
      color: #999;
      font-size: 18px !important;
      width: 18px !important;
      height: 18px !important;
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

    .result-icon {
      color: #1976d2;
      font-size: 20px;
      width: 20px;
      height: 20px;
      margin-top: 2px;
    }

    .result-text {
      flex: 1;
      min-width: 0;
    }

    .result-name {
      display: block;
      font-size: 13px;
      font-weight: 500;
      color: #333;
    }

    .result-address {
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

    .selected-location {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 8px;
      padding: 8px 12px;
      background: #e8f5e9;
      border-radius: 8px;
      font-size: 12px;
      color: #2e7d32;
    }

    .selected-location mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .point-card {
      background: #fafafa;
      border: 2px solid #e0e0e0;
      border-radius: 12px;
      padding: 12px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .point-card:hover {
      background: white;
    }

    .point-card.editing {
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .point-card.set {
      background: white;
    }

    .point-card.pickup.set {
      border-color: #4caf50;
    }

    .point-card.dropoff.set {
      border-color: #f44336;
    }

    .point-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 10px;
    }

    .point-badge {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      font-weight: bold;
      font-size: 16px;
      color: white;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    }

    .point-badge.pickup {
      background: linear-gradient(135deg, #9c27b0, #7b1fa2);
    }

    .point-badge.dropoff {
      background: linear-gradient(135deg, #ff9800, #f57c00);
    }

    .point-details {
      flex: 1;
      min-width: 0;
    }

    .point-label {
      display: block;
      font-size: 13px;
      font-weight: 600;
      color: #333;
    }

    .point-status {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      margin-top: 2px;
    }

    .point-status.set {
      color: #4caf50;
    }

    .point-status.pending {
      color: #999;
    }

    .point-status mat-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }

    .clear-btn {
      width: 28px;
      height: 28px;
      line-height: 28px;
    }

    .clear-btn mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .location-input {
      width: 100%;
    }

    ::ng-deep .location-input .mat-mdc-form-field-subscript-wrapper {
      display: none;
    }

    ::ng-deep .location-input .mat-mdc-text-field-wrapper {
      padding: 0 12px;
    }

    ::ng-deep .location-input input {
      font-size: 12px;
    }

    .edit-icon {
      font-size: 16px !important;
      width: 16px !important;
      height: 16px !important;
      color: #999;
    }

    /* Message Section */
    .message-section {
      margin-bottom: 16px;
    }

    .section-label {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 10px;
      font-size: 13px;
      font-weight: 500;
      color: #666;
    }

    .section-label mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .optional-tag {
      font-size: 11px;
      padding: 2px 8px;
      background: #f5f5f5;
      border-radius: 10px;
      color: #999;
    }

    .message-field {
      width: 100%;
    }

    /* Ready Summary */
    .ready-summary {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
      border-radius: 12px;
      border: 1px solid #a5d6a7;
    }

    .ready-icon {
      color: #2e7d32;
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    .ready-text {
      display: flex;
      flex-direction: column;
    }

    .ready-text strong {
      font-size: 14px;
      color: #2e7d32;
    }

    .ready-text span {
      font-size: 12px;
      color: #558b2f;
    }

    /* Dialog Actions */
    mat-dialog-actions {
      padding: 16px 24px !important;
      margin: 0 !important;
      border-top: 1px solid #e0e0e0;
      gap: 12px;
    }

    .cancel-btn {
      color: #666;
    }

    .send-btn {
      min-width: 150px;
      height: 44px;
      border-radius: 22px;
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

    .send-btn mat-spinner {
      display: inline-block;
    }

    /* Responsive */
    @media (max-width: 720px) {
      mat-dialog-content {
        min-width: auto;
        padding: 16px !important;
        max-width: 100%;
        overflow-x: hidden;
      }

      .dialog-header {
        padding: 16px;
        max-width: 100%;
      }

      .header-icon {
        display: none;
      }

      .progress-line {
        width: 24px;
      }

      .points-section {
        grid-template-columns: 1fr;
        max-width: 100%;
      }

      .route-flow {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
        max-width: 100%;
      }

      .route-arrow {
        transform: rotate(90deg);
        align-self: center;
      }

      .map-container {
        height: 220px;
      }

      .location-text,
      .point-text {
        white-space: normal !important;
        word-break: break-word;
      }
    }
  `]
})
export class RequestRideDialogComponent implements AfterViewInit, OnDestroy {
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
  
  // Search-related properties
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

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { ride: RideListItem },
    private dialogRef: MatDialogRef<RequestRideDialogComponent>,
    private rideService: RideService,
    private snackBar: MatSnackBar
  ) {}

  ngAfterViewInit(): void {
    setTimeout(() => this.initMap(), 100);
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }

  private initMap(): void {
    const ride = this.data.ride;
    
    // Default center - use ride's origin if available, otherwise Dhaka
    let centerLat = 23.8103;
    let centerLng = 90.4125;
    
    if (ride.originLat && ride.originLng) {
      centerLat = ride.originLat;
      centerLng = ride.originLng;
    }

    this.map = L.map('request-map', {
      zoomControl: true,
      attributionControl: false
    }).setView([centerLat, centerLng], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: ''
    }).addTo(this.map);

    // Add custom marker styles
    this.addMarkerStyles();

    // Add rider's origin marker (A - Green)
    if (ride.originLat && ride.originLng) {
      const originIcon = L.divIcon({
        className: 'custom-marker origin-marker',
        html: `<div class="marker-circle origin-circle"><span>A</span></div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });
      L.marker([ride.originLat, ride.originLng], { icon: originIcon })
        .addTo(this.map)
        .bindPopup(`<strong>Rider's Start (A):</strong><br>${ride.origin}`);
    }

    // Add rider's destination marker (B - Red)
    if (ride.destLat && ride.destLng) {
      const destIcon = L.divIcon({
        className: 'custom-marker dest-marker',
        html: `<div class="marker-circle dest-circle"><span>B</span></div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });
      L.marker([ride.destLat, ride.destLng], { icon: destIcon })
        .addTo(this.map)
        .bindPopup(`<strong>Rider's End (B):</strong><br>${ride.destination}`);
    }

    // Fetch and draw actual driving route using OSRM
    if (ride.originLat && ride.originLng && ride.destLat && ride.destLng) {
      this.fetchAndDrawRoute(ride.originLat, ride.originLng, ride.destLat, ride.destLng);
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
      .origin-circle {
        background: linear-gradient(135deg, #4caf50 0%, #2e7d32 100%);
      }
      .dest-circle {
        background: linear-gradient(135deg, #f44336 0%, #c62828 100%);
      }
      .pickup-circle {
        background: linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%);
      }
      .dropoff-circle {
        background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
      }
      @keyframes ping {
        0% { transform: scale(1); opacity: 0.5; }
        100% { transform: scale(2); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  private routeLine?: L.Polyline;

  private fetchAndDrawRoute(originLat: number, originLng: number, destLat: number, destLng: number): void {
    if (!this.map) return;

    this.routeLoading = true;

    // Remove existing route line
    if (this.routeLine) {
      this.map.removeLayer(this.routeLine);
    }

    // OSRM API for motorcycle routing with timeout
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
        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const coordinates = route.geometry.coordinates;
          
          // Convert [lng, lat] to [lat, lng] for Leaflet
          const latLngs: L.LatLngExpression[] = coordinates.map((coord: number[]) => [coord[1], coord[0]]);

          // Draw the actual route
          this.routeLine = L.polyline(latLngs, {
            color: '#1976d2',
            weight: 5,
            opacity: 0.8,
            lineCap: 'round',
            lineJoin: 'round'
          }).addTo(this.map!);

          // Fit bounds to show the full route
          this.map!.fitBounds(this.routeLine.getBounds(), { padding: [50, 50] });
        } else {
          // Fallback to straight line if OSRM fails
          this.drawFallbackLine(originLat, originLng, destLat, destLng);
        }
      })
      .catch(() => {
        clearTimeout(timeoutId);
        this.routeLoading = false;
        // Fallback to straight line on error/timeout
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

      // Remove old marker
      if (this.pickupMarker) {
        this.map.removeLayer(this.pickupMarker);
      }

      // Add new marker with consistent style
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

      // Handle drag
      this.pickupMarker.on('dragend', (e: L.LeafletEvent) => {
        const marker = e.target as L.Marker;
        const pos = marker.getLatLng();
        this.pickupLat = pos.lat;
        this.pickupLng = pos.lng;
        this.updateFullRouteIfReady();
      });

      this.snackBar.open('Pickup point set! Now set your drop-off.', 'OK', { 
        duration: 2500,
        panelClass: 'success-snackbar'
      });
      this.selectionMode = 'dropoff';
      this.updateFullRouteIfReady();
    } else {
      this.dropoffLat = latlng.lat;
      this.dropoffLng = latlng.lng;

      // Remove old marker
      if (this.dropoffMarker) {
        this.map.removeLayer(this.dropoffMarker);
      }

      // Add new marker with consistent style
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

      // Handle drag
      this.dropoffMarker.on('dragend', (e: L.LeafletEvent) => {
        const marker = e.target as L.Marker;
        const pos = marker.getLatLng();
        this.dropoffLat = pos.lat;
        this.dropoffLng = pos.lng;
        this.updateFullRouteIfReady();
      });

      this.snackBar.open('Drop-off point set! Ready to send request.', 'OK', { 
        duration: 2500 
      });
      this.updateFullRouteIfReady();
    }
  }

  clearPickup(event: Event): void {
    event.stopPropagation();
    if (this.pickupMarker && this.map) {
      this.map.removeLayer(this.pickupMarker);
    }
    this.pickupMarker = null;
    this.pickupLat = undefined;
    this.pickupLng = undefined;
    this.pickupLocation = '';
    this.selectionMode = 'pickup';
    // Restore original A-B route
    this.restoreOriginalRoute();
  }

  clearDropoff(event: Event): void {
    event.stopPropagation();
    if (this.dropoffMarker && this.map) {
      this.map.removeLayer(this.dropoffMarker);
    }
    this.dropoffMarker = null;
    this.dropoffLat = undefined;
    this.dropoffLng = undefined;
    this.dropoffLocation = '';
    // Restore original A-B route
    this.restoreOriginalRoute();
  }

  resetPoints(): void {
    this.clearPickup(new Event('click'));
    this.clearDropoff(new Event('click'));
    this.selectionMode = 'pickup';
    this.snackBar.open('Points cleared. Start over.', 'OK', { duration: 1500 });
  }

  private restoreOriginalRoute(): void {
    const ride = this.data.ride;
    if (ride.originLat && ride.originLng && ride.destLat && ride.destLng) {
      this.fetchAndDrawRoute(ride.originLat, ride.originLng, ride.destLat, ride.destLng);
    }
  }

  isValid(): boolean {
    // Require at least pickup location (either name or coordinates)
    return !!(this.pickupLocation || (this.pickupLat && this.pickupLng));
  }

  getShortAddress(fullAddress: string): string {
    if (!fullAddress) return '';
    const parts = fullAddress.split(/[,،]/);
    let shortAddr = parts[0].trim().replace(/^\d+\s*/, '');
    if (shortAddr.length < 3) shortAddr = parts[0].trim();
    return shortAddr.length > 20 ? shortAddr.substring(0, 20) + '...' : shortAddr;
  }

  formatShortDateTime(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  sendRequest(): void {
    this.sending = true;
    this.rideService.requestToJoin(this.data.ride.id, {
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
        this.dialogRef.close('success');
      },
      error: (err) => {
        this.sending = false;
        const message = err.error?.message || 'Failed to send request. You may have already requested this ride.';
        this.snackBar.open(message, 'Close', { duration: 4000 });
      }
    });
  }

  // Search methods using Nominatim API
  onPickupSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.pickupSearchQuery = value;
    this.showPickupResults = true;
    this.searchLocation(value, 'pickup');
  }

  onDropoffSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.dropoffSearchQuery = value;
    this.showDropoffResults = true;
    this.searchLocation(value, 'dropoff');
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
      // Use Nominatim API for geocoding
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=bd`;
      
      fetch(url, {
        headers: {
          'Accept': 'application/json'
        }
      })
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

  selectPickupResult(result: any): void {
    this.pickupLocation = result.display_name;
    this.pickupSearchQuery = this.getShortDisplayName(result.display_name);
    this.pickupLat = parseFloat(result.lat);
    this.pickupLng = parseFloat(result.lon);
    this.showPickupResults = false;
    this.pickupSearchResults = [];

    // Update map marker
    if (this.map) {
      this.updateMarkerFromSearch(this.pickupLat, this.pickupLng, 'pickup');
      // Update route if both P and D are set
      this.updateFullRouteIfReady();
    }
    
    this.snackBar.open('Pickup location set!', 'OK', { duration: 2000 });
    this.selectionMode = 'dropoff';
  }

  selectDropoffResult(result: any): void {
    this.dropoffLocation = result.display_name;
    this.dropoffSearchQuery = this.getShortDisplayName(result.display_name);
    this.dropoffLat = parseFloat(result.lat);
    this.dropoffLng = parseFloat(result.lon);
    this.showDropoffResults = false;
    this.dropoffSearchResults = [];

    // Update map marker
    if (this.map) {
      this.updateMarkerFromSearch(this.dropoffLat, this.dropoffLng, 'dropoff');
      // Update route if both P and D are set
      this.updateFullRouteIfReady();
    }
    
    this.snackBar.open('Drop-off location set!', 'OK', { duration: 2000 });
  }

  private updateFullRouteIfReady(): void {
    const ride = this.data.ride;
    
    // Check if both P and D are set and we have A and B
    if (this.pickupLat && this.pickupLng && this.dropoffLat && this.dropoffLng &&
        ride.originLat && ride.originLng && ride.destLat && ride.destLng) {
      // Draw route A → P → D → B
      this.fetchAndDrawFullRoute(
        ride.originLat, ride.originLng,    // A
        this.pickupLat, this.pickupLng,    // P
        this.dropoffLat, this.dropoffLng,  // D
        ride.destLat, ride.destLng         // B
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

    // Remove existing route line
    if (this.routeLine) {
      this.map.removeLayer(this.routeLine);
    }

    // OSRM API with waypoints: A → P → D → B
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
        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const coordinates = route.geometry.coordinates;
          
          // Convert [lng, lat] to [lat, lng] for Leaflet
          const latLngs: L.LatLngExpression[] = coordinates.map((coord: number[]) => [coord[1], coord[0]]);

          // Draw the full route A → P → D → B
          this.routeLine = L.polyline(latLngs, {
            color: '#1976d2',
            weight: 5,
            opacity: 0.8,
            lineCap: 'round',
            lineJoin: 'round'
          }).addTo(this.map!);

          // Fit bounds to show the full route
          this.map!.fitBounds(this.routeLine.getBounds(), { padding: [50, 50] });
        } else {
          // Fallback to straight lines if OSRM fails
          this.drawFallbackFullRoute(aLat, aLng, pLat, pLng, dLat, dLng, bLat, bLng);
        }
      })
      .catch(() => {
        clearTimeout(timeoutId);
        this.routeLoading = false;
        // Fallback to straight lines on error/timeout
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

    // Remove existing route
    if (this.routeLine) {
      this.map.removeLayer(this.routeLine);
    }

    // Draw straight line A → P → D → B
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

    // Pan to the selected location
    this.map.panTo([lat, lng]);
  }

  getShortDisplayName(displayName: string): string {
    if (!displayName) return '';
    const parts = displayName.split(',');
    return parts.slice(0, 2).join(', ').trim();
  }

  onSearchBlur(type: 'pickup' | 'dropoff'): void {
    // Delay hiding to allow click on results
    setTimeout(() => {
      if (type === 'pickup') {
        this.showPickupResults = false;
      } else {
        this.showDropoffResults = false;
      }
    }, 200);
  }

  onSearchFocus(type: 'pickup' | 'dropoff'): void {
    if (type === 'pickup' && this.pickupSearchResults.length > 0) {
      this.showPickupResults = true;
    } else if (type === 'dropoff' && this.dropoffSearchResults.length > 0) {
      this.showDropoffResults = true;
    }
  }

  clearPickupSearch(event: Event): void {
    event.stopPropagation();
    this.pickupSearchQuery = '';
    this.pickupSearchResults = [];
    this.showPickupResults = false;
    this.clearPickup(event);
  }

  clearDropoffSearch(event: Event): void {
    event.stopPropagation();
    this.dropoffSearchQuery = '';
    this.dropoffSearchResults = [];
    this.showDropoffResults = false;
    this.clearDropoff(event);
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
