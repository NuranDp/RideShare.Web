import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NearbyRequest } from '../../../models/on-demand.model';

export interface NearbyRequestDialogData {
  request: NearbyRequest;
}

@Component({
  selector: 'app-nearby-request-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="dialog-container">
      <!-- Drag Handle -->
      <div class="drag-handle"></div>
      
      <!-- Header with Timer -->
      <div class="dialog-header">
        <div class="header-icon pulse">
          <mat-icon>hail</mat-icon>
        </div>
        <div class="header-text">
          <span class="header-title">Ride Request</span>
          <span class="header-subtitle">On-demand pickup</span>
        </div>
        <div class="timer-badge" [class.urgent]="getSecondsRemaining() < 60">
          <mat-icon>timer</mat-icon>
          <span>{{ getTimeRemaining() }}</span>
        </div>
        <button class="close-btn" mat-dialog-close>
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Passenger Info -->
      <div class="passenger-section">
        <div class="passenger-avatar">
          @if (data.request.passengerPhoto) {
            <img [src]="data.request.passengerPhoto" alt="Passenger">
          } @else {
            <mat-icon>person</mat-icon>
          }
        </div>
        <div class="passenger-details">
          <span class="passenger-name">{{ data.request.passengerName }}</span>
          <span class="passenger-subtitle">needs a ride now</span>
        </div>
        <div class="distance-badge">
          <mat-icon>near_me</mat-icon>
          <span>{{ data.request.distanceKm }} km</span>
        </div>
      </div>

      <!-- Route Section -->
      <div class="route-section">
        <div class="route-block">
          <div class="route-label">
            <mat-icon>route</mat-icon>
            <span>Trip Details</span>
          </div>
          <div class="journey-visual">
            <!-- Pickup -->
            <div class="journey-point">
              <div class="point-marker pickup">
                <mat-icon>my_location</mat-icon>
              </div>
              <div class="point-content">
                <span class="point-label">Pickup</span>
                <span class="point-text">{{ data.request.pickupLocation }}</span>
              </div>
            </div>
            
            <!-- Route Line -->
            <div class="route-line">
              <div class="line-dashed"></div>
              @if (data.request.estimatedRouteKm) {
                <span class="route-distance">~{{ data.request.estimatedRouteKm | number:'1.1-1' }} km</span>
              }
            </div>
            
            <!-- Dropoff -->
            <div class="journey-point">
              <div class="point-marker dropoff">
                <mat-icon>location_on</mat-icon>
              </div>
              <div class="point-content">
                <span class="point-label">Dropoff</span>
                <span class="point-text">{{ data.request.dropoffLocation }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Message -->
      @if (data.request.message) {
        <div class="message-section">
          <mat-icon>chat_bubble_outline</mat-icon>
          <span>"{{ data.request.message }}"</span>
        </div>
      }

      <!-- Actions -->
      <div class="dialog-actions">
        <button class="action-btn cancel" mat-dialog-close>
          <mat-icon>close</mat-icon>
          <span>Cancel</span>
        </button>
        <button class="action-btn accept" 
                (click)="accept()" 
                [disabled]="accepting">
          @if (accepting) {
            <mat-spinner diameter="20"></mat-spinner>
          } @else {
            <mat-icon>check</mat-icon>
          }
          <span>{{ accepting ? 'Accepting...' : 'Accept Ride' }}</span>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .dialog-container {
      display: flex;
      flex-direction: column;
      max-height: 85vh;
      overflow-y: auto;
      animation: slideUp 0.3s ease;
    }

    @keyframes slideUp {
      from {
        transform: translateY(30px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    .drag-handle {
      width: 40px;
      height: 4px;
      background: rgba(255, 255, 255, 0.5);
      border-radius: 2px;
      margin: 12px auto 0;
      position: absolute;
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      z-index: 10;
    }

    .dialog-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 28px 20px 20px;
      background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
      color: white;
      position: relative;
    }

    .header-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;

      &.pulse {
        animation: pulse 2s infinite;
      }

      mat-icon {
        font-size: 28px;
        width: 28px;
        height: 28px;
      }
    }

    @keyframes pulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.4); }
      50% { box-shadow: 0 0 0 12px rgba(255, 255, 255, 0); }
    }

    .header-text {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .header-title {
      font-size: 18px;
      font-weight: 600;
    }

    .header-subtitle {
      font-size: 13px;
      opacity: 0.9;
    }

    .timer-badge {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 8px 14px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 20px;
      font-size: 15px;
      font-weight: 600;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      &.urgent {
        background: rgba(244, 67, 54, 0.9);
        animation: pulse 1s infinite;
      }
    }

    .close-btn {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: none;
      background: rgba(255, 255, 255, 0.15);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background 0.2s;

      &:hover {
        background: rgba(255, 255, 255, 0.25);
      }

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
    }

    .passenger-section {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 20px;
      border-bottom: 1px solid var(--border-color, #e0e0e0);
    }

    .passenger-avatar {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: linear-gradient(135deg, #ff9800, #f57c00);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      mat-icon {
        font-size: 32px;
        width: 32px;
        height: 32px;
        color: white;
      }
    }

    .passenger-details {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .passenger-name {
      font-size: 18px;
      font-weight: 600;
      color: var(--text-primary, #1a1a2e);
    }

    .passenger-subtitle {
      font-size: 14px;
      color: var(--text-muted, #6b7280);
    }

    .distance-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      background: var(--bg-secondary, #f3f4f6);
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
      color: #ff9800;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    }

    .route-section {
      padding: 20px;
    }

    .route-block {
      background: var(--bg-secondary, #f9fafb);
      border-radius: 16px;
      padding: 16px;
    }

    .route-label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--text-muted, #6b7280);
      margin-bottom: 16px;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: #ff9800;
      }
    }

    .journey-visual {
      display: flex;
      flex-direction: column;
    }

    .journey-point {
      display: flex;
      align-items: flex-start;
      gap: 14px;
    }

    .point-marker {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      mat-icon {
        font-size: 22px;
        width: 22px;
        height: 22px;
        color: white;
      }

      &.pickup {
        background: linear-gradient(135deg, #4caf50, #2e7d32);
      }

      &.dropoff {
        background: linear-gradient(135deg, #f44336, #c62828);
      }
    }

    .point-content {
      display: flex;
      flex-direction: column;
      padding-top: 4px;
      min-width: 0;
    }

    .point-label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--text-muted, #6b7280);
    }

    .point-text {
      font-size: 15px;
      font-weight: 500;
      color: var(--text-primary, #1a1a2e);
      margin-top: 2px;
      word-break: break-word;
    }

    .route-line {
      display: flex;
      align-items: center;
      gap: 14px;
      padding-left: 19px;
      margin: 6px 0;
    }

    .line-dashed {
      width: 2px;
      height: 28px;
      background: repeating-linear-gradient(
        to bottom,
        var(--text-muted, #9ca3af) 0,
        var(--text-muted, #9ca3af) 4px,
        transparent 4px,
        transparent 8px
      );
      opacity: 0.5;
    }

    .route-distance {
      font-size: 13px;
      font-weight: 500;
      color: var(--text-secondary, #4b5563);
      background: white;
      padding: 4px 12px;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .message-section {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 0 20px 20px;
      color: var(--text-secondary, #4b5563);
      font-size: 14px;
      font-style: italic;

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
        flex-shrink: 0;
        margin-top: 2px;
        color: var(--text-muted, #9ca3af);
      }
    }

    .dialog-actions {
      display: flex;
      gap: 12px;
      padding: 20px;
      background: var(--bg-secondary, #f9fafb);
    }

    .action-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 14px 20px;
      border: none;
      border-radius: 12px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;

      mat-icon, mat-spinner {
        font-size: 22px;
        width: 22px;
        height: 22px;
      }

      &:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }

      &.cancel {
        background: white;
        color: var(--text-secondary, #4b5563);
        border: 1px solid var(--border-color, #e5e7eb);

        &:hover:not(:disabled) {
          background: var(--bg-secondary, #f3f4f6);
        }
      }

      &.accept {
        flex: 1.5;
        background: linear-gradient(135deg, #4caf50, #2e7d32);
        color: white;

        &:hover:not(:disabled) {
          transform: scale(1.02);
          box-shadow: 0 4px 14px rgba(76, 175, 80, 0.4);
        }
      }
    }
  `]
})
export class NearbyRequestDialogComponent {
  accepting = false;

  constructor(
    public dialogRef: MatDialogRef<NearbyRequestDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: NearbyRequestDialogData
  ) {}

  getSecondsRemaining(): number {
    let expiresAtStr = this.data.request.expiresAt;
    // Server sends UTC time without 'Z' suffix - append it for correct parsing
    if (!expiresAtStr.endsWith('Z') && !expiresAtStr.includes('+')) {
      expiresAtStr += 'Z';
    }
    const expiresAt = new Date(expiresAtStr).getTime();
    const now = Date.now();
    return Math.max(0, Math.floor((expiresAt - now) / 1000));
  }

  getTimeRemaining(): string {
    const seconds = this.getSecondsRemaining();
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  accept(): void {
    this.accepting = true;
    this.dialogRef.close({ accepted: true });
  }
}
