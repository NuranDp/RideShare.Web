import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { NotificationService, Notification } from '../../services/notification.service';

@Component({
  selector: 'app-notification-toast',
  standalone: true,
  imports: [CommonModule, MatSnackBarModule],
  template: ``,
  styles: []
})
export class NotificationToastComponent implements OnInit, OnDestroy {
  private notificationService = inject(NotificationService);
  private snackBar = inject(MatSnackBar);
  private lastNotificationCount = 0;

  ngOnInit(): void {
    // Request browser notification permission on init
    this.notificationService.requestBrowserNotificationPermission();
    
    // Initial count
    this.lastNotificationCount = this.notificationService.notifications().length;
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  // This will be called periodically to check for new notifications
  checkForNewNotifications(): void {
    const currentCount = this.notificationService.notifications().length;
    if (currentCount > this.lastNotificationCount) {
      const newNotifications = this.notificationService.notifications().slice(0, currentCount - this.lastNotificationCount);
      newNotifications.forEach(notification => {
        this.showSnackBar(notification);
      });
    }
    this.lastNotificationCount = currentCount;
  }

  private showSnackBar(notification: Notification): void {
    this.snackBar.open(
      `${notification.title}: ${notification.message}`,
      'View',
      {
        duration: 5000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: this.getSnackBarClass(notification.type)
      }
    );
  }

  private getSnackBarClass(type: string): string[] {
    switch (type) {
      case 'request_accepted': return ['notification-success'];
      case 'request_rejected':
      case 'ride_cancelled': return ['notification-warning'];
      case 'new_rating': return ['notification-info'];
      default: return ['notification-default'];
    }
  }
}
