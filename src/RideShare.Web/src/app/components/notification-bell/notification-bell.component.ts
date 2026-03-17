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
  templateUrl: './notification-bell.component.html',
  styleUrls: ['./notification-bell.component.scss']
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
