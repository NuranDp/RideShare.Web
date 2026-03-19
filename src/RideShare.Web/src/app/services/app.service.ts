import { Injectable, inject, NgZone } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { App, BackButtonListenerEvent } from '@capacitor/app';
import { SplashScreen } from '@capacitor/splash-screen';
import { PlatformService } from './platform.service';
import { filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AppService {
  private platform = inject(PlatformService);
  private router = inject(Router);
  private ngZone = inject(NgZone);
  
  private navigationHistory: string[] = [];
  private exitConfirmShown = false;

  /**
   * Initialize app plugins and listeners
   * Call this in app.component.ts ngOnInit
   */
  async initialize(): Promise<void> {
    if (this.platform.isNative) {
      // Hide splash screen after app is ready
      await this.hideSplashScreen();
      
      // Register back button handler
      this.registerBackButtonHandler();
      
      // Track navigation for back button handling
      this.trackNavigation();
      
      // Handle app state changes
      this.registerAppStateListeners();
    }
  }

  /**
   * Hide the splash screen
   */
  async hideSplashScreen(): Promise<void> {
    try {
      await SplashScreen.hide({
        fadeOutDuration: 500
      });
    } catch (error) {
      console.error('Error hiding splash screen:', error);
    }
  }

  /**
   * Show the splash screen (useful for app restarts)
   */
  async showSplashScreen(): Promise<void> {
    try {
      await SplashScreen.show({
        autoHide: false
      });
    } catch (error) {
      console.error('Error showing splash screen:', error);
    }
  }

  /**
   * Register Android hardware back button handler
   */
  private registerBackButtonHandler(): void {
    App.addListener('backButton', (event: BackButtonListenerEvent) => {
      this.ngZone.run(() => {
        this.handleBackButton(event);
      });
    });
  }

  /**
   * Handle back button press
   */
  private handleBackButton(event: BackButtonListenerEvent): void {
    // Check if we can go back in app navigation
    if (event.canGoBack) {
      // Use Angular router to go back
      window.history.back();
    } else {
      // We're at the root - show exit confirmation or exit
      this.handleExitApp();
    }
  }

  /**
   * Handle app exit behavior
   */
  private handleExitApp(): void {
    const rootRoutes = ['/login', '/register', '/rider', '/passenger'];
    const currentUrl = this.router.url;
    
    // Check if we're on a root/dashboard route
    const isRootRoute = rootRoutes.some(route => 
      currentUrl === route || currentUrl.startsWith(route + '/')
    );

    if (isRootRoute) {
      // On dashboard - exit app
      if (!this.exitConfirmShown) {
        this.exitConfirmShown = true;
        // Show toast or confirmation
        this.showExitToast();
        
        // Reset after 2 seconds
        setTimeout(() => {
          this.exitConfirmShown = false;
        }, 2000);
      } else {
        // Second press - exit
        App.exitApp();
      }
    } else {
      // Not on root - navigate back
      window.history.back();
    }
  }

  /**
   * Show exit confirmation toast
   * You can replace this with a proper toast/snackbar
   */
  private showExitToast(): void {
    // Simple alert for now - replace with MatSnackBar if desired
    console.log('Press back again to exit');
    // Optionally dispatch a custom event for the UI to show a toast
    window.dispatchEvent(new CustomEvent('app:exitConfirm'));
  }

  /**
   * Track navigation for smart back button behavior
   */
  private trackNavigation(): void {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.navigationHistory.push(event.url);
      // Keep only last 20 items
      if (this.navigationHistory.length > 20) {
        this.navigationHistory.shift();
      }
    });
  }

  /**
   * Register app state change listeners
   */
  private registerAppStateListeners(): void {
    // App resumed from background
    App.addListener('appStateChange', (state) => {
      this.ngZone.run(() => {
        if (state.isActive) {
          console.log('App resumed');
          // Optionally refresh data here
          window.dispatchEvent(new CustomEvent('app:resumed'));
        } else {
          console.log('App paused');
          window.dispatchEvent(new CustomEvent('app:paused'));
        }
      });
    });

    // App URL opened (deep linking)
    App.addListener('appUrlOpen', (data) => {
      this.ngZone.run(() => {
        console.log('App opened with URL:', data.url);
        this.handleDeepLink(data.url);
      });
    });
  }

  /**
   * Handle deep links
   */
  private handleDeepLink(url: string): void {
    // Parse the URL and navigate accordingly
    // Example: rideshare://ride/123 -> /passenger/ride/123
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname;
      
      if (path) {
        this.router.navigateByUrl(path);
      }
    } catch {
      console.error('Invalid deep link URL:', url);
    }
  }

  /**
   * Get app info
   */
  async getAppInfo(): Promise<{ name: string; id: string; version: string; build: string } | null> {
    if (this.platform.isNative) {
      try {
        return await App.getInfo();
      } catch {
        return null;
      }
    }
    return null;
  }

  /**
   * Clean up listeners
   */
  destroy(): void {
    if (this.platform.isNative) {
      App.removeAllListeners();
    }
  }
}
