import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import * as signalR from '@microsoft/signalr';
import { AuthService } from './auth.service';

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  timestamp: Date;
  data?: Record<string, unknown>;
  read: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private hubConnection: signalR.HubConnection | null = null;
  private readonly hubUrl = 'http://localhost:5000/hubs/notifications';
  
  private notificationsSignal = signal<Notification[]>([]);
  private connectionStateSignal = signal<'disconnected' | 'connecting' | 'connected'>('disconnected');
  
  notifications = this.notificationsSignal.asReadonly();
  connectionState = this.connectionStateSignal.asReadonly();
  unreadCount = computed(() => this.notificationsSignal().filter(n => !n.read).length);
  
  private authService = inject(AuthService);

  constructor() {
    // Auto-connect/disconnect based on auth state
    effect(() => {
      const user = this.authService.currentUser();
      if (user) {
        this.connect();
      } else {
        this.disconnect();
      }
    });
  }

  async connect(): Promise<void> {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      return;
    }

    const token = localStorage.getItem('auth_token');
    if (!token) {
      console.warn('No auth token available for SignalR connection');
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

    // Handle incoming notifications
    this.hubConnection.on('ReceiveNotification', (notification: Omit<Notification, 'read'>) => {
      const newNotification: Notification = {
        ...notification,
        timestamp: new Date(notification.timestamp),
        read: false
      };
      
      this.notificationsSignal.update(notifications => [newNotification, ...notifications]);
      
      // Show browser notification if supported and permitted
      this.showBrowserNotification(newNotification);
    });

    // Handle reconnection events
    this.hubConnection.onreconnecting(() => {
      this.connectionStateSignal.set('connecting');
    });

    this.hubConnection.onreconnected(() => {
      this.connectionStateSignal.set('connected');
    });

    this.hubConnection.onclose(() => {
      this.connectionStateSignal.set('disconnected');
    });

    try {
      await this.hubConnection.start();
      this.connectionStateSignal.set('connected');
      console.log('SignalR Connected');
    } catch (err) {
      console.error('SignalR Connection Error:', err);
      this.connectionStateSignal.set('disconnected');
    }
  }

  async disconnect(): Promise<void> {
    if (this.hubConnection) {
      try {
        await this.hubConnection.stop();
      } catch (err) {
        console.error('SignalR Disconnect Error:', err);
      }
      this.hubConnection = null;
      this.connectionStateSignal.set('disconnected');
    }
  }

  markAsRead(notificationId: string): void {
    this.notificationsSignal.update(notifications =>
      notifications.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
  }

  markAllAsRead(): void {
    this.notificationsSignal.update(notifications =>
      notifications.map(n => ({ ...n, read: true }))
    );
  }

  clearNotifications(): void {
    this.notificationsSignal.set([]);
  }

  removeNotification(notificationId: string): void {
    this.notificationsSignal.update(notifications =>
      notifications.filter(n => n.id !== notificationId)
    );
  }

  private async showBrowserNotification(notification: Notification): Promise<void> {
    if (!('Notification' in window)) {
      return;
    }

    if (Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.id
      });
    } else if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico',
          tag: notification.id
        });
      }
    }
  }

  requestBrowserNotificationPermission(): void {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }
}
