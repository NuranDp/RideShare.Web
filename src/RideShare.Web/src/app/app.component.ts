import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NotificationService } from './services/notification.service';
import { AppService } from './services/app.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet></router-outlet>`,
  styles: []
})
export class AppComponent implements OnInit, OnDestroy {
  // Inject to initialize the notification service early
  private notificationService = inject(NotificationService);
  private appService = inject(AppService);

  ngOnInit(): void {
    // Initialize native app features (splash screen, back button, etc.)
    this.appService.initialize();
  }

  ngOnDestroy(): void {
    this.appService.destroy();
  }
}
