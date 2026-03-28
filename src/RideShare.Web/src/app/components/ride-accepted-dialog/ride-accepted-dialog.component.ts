import { Component, Inject, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import * as L from 'leaflet';

export interface RideAcceptedDialogData {
  rideId: string;
  riderName: string;
  riderPhone: string;
  origin: string;
  destination: string;
  originLat: number;
  originLng: number;
  destLat: number;
  destLng: number;
  vehicleModel: string;
  plateNumber: string;
}

@Component({
  selector: 'app-ride-accepted-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './ride-accepted-dialog.component.html',
  styleUrls: ['./ride-accepted-dialog.component.scss']
})
export class RideAcceptedDialogComponent implements AfterViewInit, OnDestroy {
  private map: L.Map | null = null;

  constructor(
    public dialogRef: MatDialogRef<RideAcceptedDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: RideAcceptedDialogData
  ) {}

  ngAfterViewInit(): void {
    setTimeout(() => this.initMap(), 150);
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  private initMap(): void {
    const hasOrigin = this.data.originLat && this.data.originLng;
    const hasDest = this.data.destLat && this.data.destLng;

    if (!hasOrigin && !hasDest) return;

    const centerLat = this.data.originLat || this.data.destLat || 0;
    const centerLng = this.data.originLng || this.data.destLng || 0;

    this.map = L.map('accepted-map', {
      zoomControl: false,
      attributionControl: false,
      dragging: true,
      scrollWheelZoom: false
    }).setView([centerLat, centerLng], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(this.map);

    const originIcon = L.divIcon({
      className: 'custom-marker',
      html: '<div style="background:#4caf50; width:20px; height:20px; border-radius:50%; border:3px solid white; box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>',
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });

    const destIcon = L.divIcon({
      className: 'custom-marker',
      html: '<div style="background:#f44336; width:20px; height:20px; border-radius:50%; border:3px solid white; box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>',
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });

    const bounds: L.LatLngExpression[] = [];

    if (hasOrigin) {
      L.marker([this.data.originLat, this.data.originLng], { icon: originIcon })
        .addTo(this.map)
        .bindPopup(`<strong>Pickup:</strong> ${this.data.origin}`);
      bounds.push([this.data.originLat, this.data.originLng]);
    }

    if (hasDest) {
      L.marker([this.data.destLat, this.data.destLng], { icon: destIcon })
        .addTo(this.map)
        .bindPopup(`<strong>Drop-off:</strong> ${this.data.destination}`);
      bounds.push([this.data.destLat, this.data.destLng]);
    }

    if (bounds.length === 2) {
      this.map.fitBounds(L.latLngBounds(bounds), { padding: [30, 30] });
    }
  }

  viewRide(): void {
    this.dialogRef.close('view');
  }

  dismiss(): void {
    this.dialogRef.close();
  }
}
