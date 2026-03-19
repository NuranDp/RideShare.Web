import { Injectable, inject } from '@angular/core';
import { Geolocation, Position, PermissionStatus } from '@capacitor/geolocation';
import { PlatformService } from './platform.service';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: number;
}

@Injectable({
  providedIn: 'root'
})
export class NativeLocationService {
  private platform = inject(PlatformService);
  private watchId: string | null = null;

  /**
   * Check if location permissions are granted
   */
  async checkPermissions(): Promise<PermissionStatus> {
    if (this.platform.isNative) {
      return await Geolocation.checkPermissions();
    }
    // Web fallback - check via navigator
    return { location: 'granted', coarseLocation: 'granted' };
  }

  /**
   * Request location permissions
   */
  async requestPermissions(): Promise<PermissionStatus> {
    if (this.platform.isNative) {
      return await Geolocation.requestPermissions();
    }
    // Web - trigger permission via getCurrentPosition
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        () => resolve({ location: 'granted', coarseLocation: 'granted' }),
        () => resolve({ location: 'denied', coarseLocation: 'denied' })
      );
    });
  }

  /**
   * Get the current position (one-time)
   */
  async getCurrentPosition(highAccuracy = true): Promise<LocationCoordinates | null> {
    try {
      if (this.platform.isNative) {
        const position: Position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: highAccuracy,
          timeout: 10000
        });
        
        return {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        };
      } else {
        // Web fallback
        return await this.getBrowserPosition(highAccuracy);
      }
    } catch (error) {
      console.error('Error getting current position:', error);
      return null;
    }
  }

  /**
   * Start watching position (continuous tracking)
   */
  async startWatching(
    callback: (position: LocationCoordinates) => void,
    errorCallback?: (error: Error) => void,
    highAccuracy = true
  ): Promise<void> {
    try {
      if (this.platform.isNative) {
        this.watchId = await Geolocation.watchPosition(
          {
            enableHighAccuracy: highAccuracy,
            timeout: 10000,
          },
          (position, err) => {
            if (err) {
              console.error('Watch position error:', err);
              errorCallback?.(new Error(err.message));
              return;
            }
            if (position) {
              callback({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                timestamp: position.timestamp
              });
            }
          }
        );
      } else {
        // Web fallback
        const watchId = navigator.geolocation.watchPosition(
          (position) => {
            callback({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: position.timestamp
            });
          },
          (error) => {
            console.error('Browser watch position error:', error);
            errorCallback?.(new Error(error.message));
          },
          {
            enableHighAccuracy: highAccuracy,
            timeout: 10000,
            maximumAge: 0
          }
        );
        this.watchId = watchId.toString();
      }
    } catch (error) {
      console.error('Error starting position watch:', error);
      errorCallback?.(error as Error);
    }
  }

  /**
   * Stop watching position
   */
  async stopWatching(): Promise<void> {
    if (this.watchId) {
      if (this.platform.isNative) {
        await Geolocation.clearWatch({ id: this.watchId });
      } else {
        navigator.geolocation.clearWatch(parseInt(this.watchId, 10));
      }
      this.watchId = null;
    }
  }

  /**
   * Browser geolocation fallback
   */
  private getBrowserPosition(highAccuracy: boolean): Promise<LocationCoordinates | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          });
        },
        (error) => {
          console.error('Browser getCurrentPosition error:', error);
          resolve(null);
        },
        {
          enableHighAccuracy: highAccuracy,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  }
}
