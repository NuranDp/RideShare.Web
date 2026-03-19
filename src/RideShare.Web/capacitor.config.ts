import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.rideshare.app',
  appName: 'RideShare',
  webDir: 'dist/ride-share.web/browser',
  
  // Android-specific settings
  android: {
    allowMixedContent: true, // Allow HTTP during development
  },
  
  // Plugin configurations
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    Geolocation: {
      // Request background location permission for ride tracking
    },
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      launchFadeOutDuration: 500,
      backgroundColor: '#034694',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
  
  // Development server (uncomment for live reload during development)
  // server: {
  //   url: 'http://YOUR_IP:4200',
  //   cleartext: true,
  // },
};

export default config;
