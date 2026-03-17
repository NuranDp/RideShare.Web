import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { NotificationService, Notification } from '../../services/notification.service';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatBadgeModule,
    MatMenuModule
  ],
  template: `
    <button mat-icon-button 
            [matMenuTriggerFor]="notificationMenu"
            [matBadge]="notificationService.unreadCount() || null"
            matBadgeColor="warn"
            matBadgeSize="small">
      <mat-icon>notifications</mat-icon>
    </button>

    <mat-menu #notificationMenu="matMenu" class="notification-menu">
      <!-- Header -->
      <div class="notification-header" (click)="$event.stopPropagation()">
        <div class="header-left">
          <mat-icon>notifications_active</mat-icon>
          <span class="header-title">Notifications</span>
        </div>
        @if (notificationService.unreadCount() > 0) {
          <button class="mark-read-btn" (click)="markAllRead()">
            <mat-icon>done_all</mat-icon>
            <span>Mark all read</span>
          </button>
        }
      </div>

      @if (notificationService.notifications().length === 0) {
        <div class="empty-notifications" (click)="$event.stopPropagation()">
          <div class="empty-icon">
            <mat-icon>notifications_none</mat-icon>
          </div>
          <p class="empty-title">No notifications</p>
          <p class="empty-subtitle">You're all caught up!</p>
        </div>
      } @else {
        <div class="notifications-list">
          @for (notification of notificationService.notifications().slice(0, 10); track notification.id) {
            <div class="notification-item" 
                 [class.unread]="!notification.read"
                 (click)="markAsRead(notification)">
              <div class="notification-icon" [ngClass]="getIconClass(notification.type)">
                <mat-icon>{{ getIcon(notification.type) }}</mat-icon>
              </div>
              <div class="notification-content">
                <div class="notification-title">{{ notification.title }}</div>
                <div class="notification-message">{{ notification.message }}</div>
                <div class="notification-time">
                  <mat-icon>schedule</mat-icon>
                  {{ formatTime(notification.timestamp) }}
                </div>
              </div>
              <button class="dismiss-btn" (click)="dismiss($event, notification)">
                <mat-icon>close</mat-icon>
              </button>
            </div>
          }
        </div>

        @if (notificationService.notifications().length > 10) {
          <div class="notification-footer" (click)="$event.stopPropagation()">
            <mat-icon>expand_more</mat-icon>
            <span>{{ notificationService.notifications().length - 10 }} more notifications</span>
          </div>
        }
      }
    </mat-menu>
  `,
  styles: [`
    :host {
      display: contents;
    }

    /* Header */
    .notification-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      background: linear-gradient(135deg, #034694 0%, #0A56A4 100%);
      color: white;
      margin: -8px -8px 0;
      border-radius: 4px 4px 0 0;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .header-left mat-icon {
      font-size: 22px;
      width: 22px;
      height: 22px;
    }

    .header-title {
      font-weight: 600;
      font-size: 16px;
    }

    .mark-read-btn {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 6px 12px;
      background: rgba(255,255,255,0.15);
      border: none;
      border-radius: 20px;
      color: white;
      font-size: 12px;
      cursor: pointer;
      transition: background 0.2s;
    }

    .mark-read-btn:hover {
      background: rgba(255,255,255,0.25);
    }

    .mark-read-btn mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    /* Empty State */
    .empty-notifications {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px 24px;
      text-align: center;
    }

    .empty-icon {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: #f5f5f5;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 12px;
    }

    .empty-icon mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: #ccc;
    }

    .empty-title {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #333;
    }

    .empty-subtitle {
      margin: 4px 0 0;
      font-size: 13px;
      color: #999;
    }

    /* Notifications List */
    .notifications-list {
      max-height: 400px;
      overflow-y: auto;
      padding: 8px 0;
    }

    .notification-item {
      display: flex;
      align-items: flex-start;
      padding: 12px 16px;
      cursor: pointer;
      transition: background-color 0.2s;
      gap: 12px;
      border-left: 3px solid transparent;
    }

    .notification-item:hover {
      background-color: #f8f9fc;
    }

    .notification-item.unread {
      background-color: rgba(3, 70, 148, 0.08);
      border-left-color: #034694;
    }

    .notification-item.unread:hover {
      background-color: rgba(3, 70, 148, 0.12);
    }

    .notification-icon {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .notification-icon mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: white;
    }

    .icon-request { background: linear-gradient(135deg, #2196f3, #1565c0); }
    .icon-accepted { background: linear-gradient(135deg, #4caf50, #2e7d32); }
    .icon-rejected { background: linear-gradient(135deg, #f44336, #c62828); }
    .icon-cancelled { background: linear-gradient(135deg, #ff9800, #ef6c00); }
    .icon-completed { background: linear-gradient(135deg, #034694, #0A56A4); }
    .icon-rating { background: linear-gradient(135deg, #ffc107, #ff8f00); }
    .icon-default { background: linear-gradient(135deg, #607d8b, #455a64); }

    .notification-content {
      flex: 1;
      min-width: 0;
    }

    .notification-title {
      font-weight: 600;
      font-size: 14px;
      color: #333;
      margin-bottom: 4px;
    }

    .notification-message {
      font-size: 13px;
      color: #666;
      line-height: 1.4;
      word-wrap: break-word;
    }

    .notification-time {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      color: #999;
      margin-top: 6px;
    }

    .notification-time mat-icon {
      font-size: 12px;
      width: 12px;
      height: 12px;
    }

    .dismiss-btn {
      opacity: 0;
      transition: all 0.2s;
      flex-shrink: 0;
      background: #f0f0f0;
      border: none;
      border-radius: 50%;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }

    .dismiss-btn:hover {
      background: #ffebee;
      color: #c62828;
    }

    .notification-item:hover .dismiss-btn {
      opacity: 1;
    }

    .dismiss-btn mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    /* Footer */
    .notification-footer {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 12px 16px;
      background: #f8f9fc;
      color: #034694;
      font-size: 13px;
      font-weight: 500;
      border-top: 1px solid #eee;
    }

    .notification-footer mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    ::ng-deep .notification-menu {
      min-width: 360px !important;
      max-width: 400px !important;
      border-radius: 16px !important;
      overflow: hidden;
    }

    ::ng-deep .notification-menu .mat-mdc-menu-content {
      padding: 0 !important;
    }
  `]
})
export class NotificationBellComponent {
  notificationService = inject(NotificationService);

  getIcon(type: string): string {
    switch (type) {
      case 'ride_request': return 'person_add';
      case 'request_accepted': return 'check_circle';
      case 'request_rejected': return 'cancel';
      case 'ride_cancelled': return 'event_busy';
      case 'ride_completed': return 'done_all';
      case 'new_rating': return 'star';
      default: return 'notifications';
    }
  }

  getIconClass(type: string): string {
    switch (type) {
      case 'ride_request': return 'icon-request';
      case 'request_accepted': return 'icon-accepted';
      case 'request_rejected': return 'icon-rejected';
      case 'ride_cancelled': return 'icon-cancelled';
      case 'ride_completed': return 'icon-completed';
      case 'new_rating': return 'icon-rating';
      default: return 'icon-default';
    }
  }

  formatTime(timestamp: Date): string {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return timestamp.toLocaleDateString();
  }

  markAsRead(notification: Notification): void {
    this.notificationService.markAsRead(notification.id);
  }

  markAllRead(): void {
    this.notificationService.markAllAsRead();
  }

  dismiss(event: Event, notification: Notification): void {
    event.stopPropagation();
    this.notificationService.removeNotification(notification.id);
  }
}
