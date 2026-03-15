import { Injectable, signal, computed, inject } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { AuthService } from './auth.service';
import { LocationUpdate } from '../models/ride.model';

@Injectable({
  providedIn: 'root'
})
export class LocationTrackingService {
  private hubConnection: signalR.HubConnection | null = null;
  private readonly hubUrl = 'http://localhost:5000/hubs/location';
  
  private currentLocationSignal = signal<LocationUpdate | null>(null);
  private connectionStateSignal = signal<'disconnected' | 'connecting' | 'connected'>('disconnected');
  private trackedRideIdSignal = signal<string | null>(null);
  
  currentLocation = this.currentLocationSignal.asReadonly();
  connectionState = this.connectionStateSignal.asReadonly();
  trackedRideId = this.trackedRideIdSignal.asReadonly();
  
  private authService = inject(AuthService);

  async connect(): Promise<void> {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      return;
    }

    const token = localStorage.getItem('auth_token');
    if (!token) {
      console.warn('No auth token available for location tracking connection');
      return;
    }

    this.connectionStateSignal.set('connecting');

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(this.hubUrl, {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    // Handle incoming location updates
    this.hubConnection.on('LocationUpdate', (update: LocationUpdate) => {
      this.currentLocationSignal.set({
        ...update,
        timestamp: new Date(update.timestamp).toISOString()
      });
    });

    // Handle reconnection events
    this.hubConnection.onreconnecting(() => {
      this.connectionStateSignal.set('connecting');
    });

    this.hubConnection.onreconnected(() => {
      this.connectionStateSignal.set('connected');
      // Rejoin the ride tracking group if we were tracking a ride
      const rideId = this.trackedRideIdSignal();
      if (rideId) {
        this.joinRideTracking(rideId);
      }
    });

    this.hubConnection.onclose(() => {
      this.connectionStateSignal.set('disconnected');
    });

    try {
      await this.hubConnection.start();
      this.connectionStateSignal.set('connected');
      console.log('Location Tracking SignalR Connected');
    } catch (err) {
      console.error('Location Tracking SignalR Connection Error:', err);
      this.connectionStateSignal.set('disconnected');
    }
  }

  async disconnect(): Promise<void> {
    if (this.hubConnection) {
      try {
        await this.hubConnection.stop();
      } catch (err) {
        console.error('Location Tracking SignalR Disconnect Error:', err);
      }
      this.hubConnection = null;
      this.connectionStateSignal.set('disconnected');
      this.trackedRideIdSignal.set(null);
      this.currentLocationSignal.set(null);
    }
  }

  async startTrackingRide(rideId: string): Promise<void> {
    // Connect if not already connected
    if (this.connectionStateSignal() !== 'connected') {
      await this.connect();
    }

    // Leave previous ride tracking if any
    const previousRideId = this.trackedRideIdSignal();
    if (previousRideId && previousRideId !== rideId) {
      await this.leaveRideTracking(previousRideId);
    }

    // Join the new ride tracking
    await this.joinRideTracking(rideId);
    this.trackedRideIdSignal.set(rideId);
    this.currentLocationSignal.set(null);
  }

  async stopTrackingRide(): Promise<void> {
    const rideId = this.trackedRideIdSignal();
    if (rideId) {
      await this.leaveRideTracking(rideId);
      this.trackedRideIdSignal.set(null);
      this.currentLocationSignal.set(null);
    }
  }

  private async joinRideTracking(rideId: string): Promise<void> {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      try {
        await this.hubConnection.invoke('JoinRideTracking', rideId);
        console.log(`Joined ride tracking for ride: ${rideId}`);
      } catch (err) {
        console.error('Error joining ride tracking:', err);
      }
    }
  }

  private async leaveRideTracking(rideId: string): Promise<void> {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      try {
        await this.hubConnection.invoke('LeaveRideTracking', rideId);
        console.log(`Left ride tracking for ride: ${rideId}`);
      } catch (err) {
        console.error('Error leaving ride tracking:', err);
      }
    }
  }

  clearLocation(): void {
    this.currentLocationSignal.set(null);
  }
}
