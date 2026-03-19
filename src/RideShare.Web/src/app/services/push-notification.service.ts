import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { PlatformService } from './platform.service';
import { environment } from '../../environments/environment';

export interface PushNotificationData {
  title: string;
  body: string;
  data?: Record<string, string>;
}

@Injectable({
  providedIn: 'root'
})
export class PushNotificationService {
  private readonly apiUrl = `${environment.apiUrl}/auth`;
  private http = inject(HttpClient);
  private platform = inject(PlatformService);
  
  private notificationListeners: ((notification: PushNotificationData) => void)[] = [];
  private actionListeners: ((action: string, data: Record<string, string>) => void)[] = [];

  /**
   * Initialize push notifications (call on app startup for logged-in users)
   */
  async initialize(): Promise<void> {
    if (!this.platform.isNative) {
      console.log('Push notifications not available on web');
      return;
    }

    try {
      // Request permission
      const permStatus = await PushNotifications.requestPermissions();
      
      if (permStatus.receive === 'granted') {
        // Register for push notifications
        await PushNotifications.register();
      } else {
        console.warn('Push notification permission denied');
        return;
      }

      // Listen for successful registration
      PushNotifications.addListener('registration', (token: Token) => {
        console.log('Push registration success, token:', token.value);
        this.sendTokenToServer(token.value);
      });

      // Listen for registration errors
      PushNotifications.addListener('registrationError', (error: any) => {
        console.error('Push registration error:', error);
      });

      // Listen for push notifications received while app is in foreground
      PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
        console.log('Push notification received:', notification);
        this.notifyListeners({
          title: notification.title || '',
          body: notification.body || '',
          data: notification.data as Record<string, string>
        });
      });

      // Listen for notification tap (app opened from notification)
      PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
        console.log('Push notification action:', action);
        const data = action.notification.data as Record<string, string>;
        this.notifyActionListeners(action.actionId, data);
      });

    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
    }
  }

  /**
   * Send FCM token to backend for push notification delivery
   */
  private sendTokenToServer(token: string): void {
    const authToken = localStorage.getItem('auth_token');
    if (!authToken) {
      console.warn('No auth token, skipping FCM token upload');
      return;
    }

    this.http.put(`${this.apiUrl}/fcm-token`, { token }).subscribe({
      next: () => console.log('FCM token sent to server'),
      error: (err) => console.error('Failed to send FCM token:', err)
    });
  }

  /**
   * Add listener for received notifications
   */
  onNotificationReceived(callback: (notification: PushNotificationData) => void): void {
    this.notificationListeners.push(callback);
  }

  /**
   * Add listener for notification actions (tap)
   */
  onNotificationAction(callback: (action: string, data: Record<string, string>) => void): void {
    this.actionListeners.push(callback);
  }

  /**
   * Remove all listeners
   */
  removeAllListeners(): void {
    this.notificationListeners = [];
    this.actionListeners = [];
    if (this.platform.isNative) {
      PushNotifications.removeAllListeners();
    }
  }

  private notifyListeners(notification: PushNotificationData): void {
    this.notificationListeners.forEach(listener => listener(notification));
  }

  private notifyActionListeners(action: string, data: Record<string, string>): void {
    this.actionListeners.forEach(listener => listener(action, data));
  }
}
