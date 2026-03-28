import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface RideStatusDialogData {
  type: 'started' | 'completed' | 'cancelled' | 'arrived';
  rideId: string;
  riderName: string;
  origin: string;
  destination: string;
  // enriched for 'completed' type
  startedAt?: string;
  completedAt?: string;
  vehicleModel?: string;
  plateNumber?: string;
}

@Component({
  selector: 'app-ride-status-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './ride-status-dialog.component.html',
  styleUrls: ['./ride-status-dialog.component.scss']
})
export class RideStatusDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<RideStatusDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: RideStatusDialogData
  ) {}

  get icon(): string {
    switch (this.data.type) {
      case 'started': return 'navigation';
      case 'completed': return 'flag';
      case 'cancelled': return 'cancel';
      case 'arrived': return 'place';
    }
  }

  get title(): string {
    switch (this.data.type) {
      case 'started': return 'Ride Started!';
      case 'completed': return 'Ride Completed!';
      case 'cancelled': return 'Ride Cancelled';
      case 'arrived': return 'Rider Has Arrived!';
    }
  }

  get subtitle(): string {
    switch (this.data.type) {
      case 'started': return 'Your rider is on the way. Track their live location!';
      case 'completed': return 'You have arrived. Please rate your experience.';
      case 'cancelled': return 'This ride has been cancelled by the rider.';
      case 'arrived': return 'Your rider is waiting at the pickup point. Please meet them now!';
    }
  }

  get actionLabel(): string {
    switch (this.data.type) {
      case 'started': return 'Track Ride';
      case 'completed': return 'Rate Rider';
      case 'cancelled': return 'Find Another Ride';
      case 'arrived': return 'View on Map';
    }
  }

  get actionIcon(): string {
    switch (this.data.type) {
      case 'started': return 'my_location';
      case 'completed': return 'star';
      case 'cancelled': return 'search';
      case 'arrived': return 'map';
    }
  }

  primaryAction(): void {
    this.dialogRef.close(this.data.type);
  }

  get duration(): string {
    if (!this.data.startedAt || !this.data.completedAt) return '';
    const start = new Date(this.data.startedAt).getTime();
    const end = new Date(this.data.completedAt).getTime();
    const mins = Math.round((end - start) / 60000);
    if (mins < 1) return '< 1 min';
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }

  get completionTime(): string {
    if (!this.data.completedAt) return '';
    return new Date(this.data.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  dismiss(): void {
    this.dialogRef.close();
  }
}
