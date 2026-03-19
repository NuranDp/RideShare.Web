import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';

@Injectable({
  providedIn: 'root'
})
export class PlatformService {
  /**
   * Check if running on a native platform (iOS/Android)
   */
  isNative = Capacitor.isNativePlatform();
  
  /**
   * Check if running on Android
   */
  isAndroid = Capacitor.getPlatform() === 'android';
  
  /**
   * Check if running on iOS
   */
  isIOS = Capacitor.getPlatform() === 'ios';
  
  /**
   * Check if running on web (browser)
   */
  isWeb = Capacitor.getPlatform() === 'web';

  /**
   * Get the current platform name
   */
  get platform(): string {
    return Capacitor.getPlatform();
  }
}
