import { Injectable, inject } from '@angular/core';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { PlatformService } from './platform.service';

export interface CapturedPhoto {
  dataUrl: string;      // Base64 data URL for display
  base64: string;       // Raw base64 for upload
  format: string;       // Image format (jpeg, png, etc.)
}

@Injectable({
  providedIn: 'root'
})
export class CameraService {
  private platform = inject(PlatformService);

  /**
   * Take a photo using the camera
   */
  async takePhoto(quality = 90): Promise<CapturedPhoto | null> {
    try {
      if (this.platform.isNative) {
        const photo: Photo = await Camera.getPhoto({
          quality,
          allowEditing: false,
          resultType: CameraResultType.Base64,
          source: CameraSource.Camera,
          saveToGallery: false
        });

        if (photo.base64String) {
          return {
            dataUrl: `data:image/${photo.format};base64,${photo.base64String}`,
            base64: photo.base64String,
            format: photo.format
          };
        }
      } else {
        // Web fallback - use file input
        return await this.webFileInput('camera');
      }
      return null;
    } catch (error) {
      console.error('Error taking photo:', error);
      return null;
    }
  }

  /**
   * Pick a photo from the gallery
   */
  async pickFromGallery(quality = 90): Promise<CapturedPhoto | null> {
    try {
      if (this.platform.isNative) {
        const photo: Photo = await Camera.getPhoto({
          quality,
          allowEditing: false,
          resultType: CameraResultType.Base64,
          source: CameraSource.Photos
        });

        if (photo.base64String) {
          return {
            dataUrl: `data:image/${photo.format};base64,${photo.base64String}`,
            base64: photo.base64String,
            format: photo.format
          };
        }
      } else {
        // Web fallback - use file input
        return await this.webFileInput('gallery');
      }
      return null;
    } catch (error) {
      console.error('Error picking photo:', error);
      return null;
    }
  }

  /**
   * Show photo source picker (camera or gallery)
   */
  async getPhoto(quality = 90): Promise<CapturedPhoto | null> {
    try {
      if (this.platform.isNative) {
        const photo: Photo = await Camera.getPhoto({
          quality,
          allowEditing: true,
          resultType: CameraResultType.Base64,
          source: CameraSource.Prompt,
          promptLabelHeader: 'Select Photo Source',
          promptLabelPhoto: 'From Gallery',
          promptLabelPicture: 'Take Photo'
        });

        if (photo.base64String) {
          return {
            dataUrl: `data:image/${photo.format};base64,${photo.base64String}`,
            base64: photo.base64String,
            format: photo.format
          };
        }
      } else {
        // Web fallback
        return await this.webFileInput('gallery');
      }
      return null;
    } catch (error) {
      // User cancelled - not an error
      if ((error as Error).message?.includes('cancelled')) {
        return null;
      }
      console.error('Error getting photo:', error);
      return null;
    }
  }

  /**
   * Check camera permissions
   */
  async checkPermissions(): Promise<boolean> {
    if (this.platform.isNative) {
      const status = await Camera.checkPermissions();
      return status.camera === 'granted' && status.photos === 'granted';
    }
    return true; // Web doesn't need explicit permissions
  }

  /**
   * Request camera permissions
   */
  async requestPermissions(): Promise<boolean> {
    if (this.platform.isNative) {
      const status = await Camera.requestPermissions();
      return status.camera === 'granted' && status.photos === 'granted';
    }
    return true;
  }

  /**
   * Web fallback using file input
   */
  private webFileInput(source: 'camera' | 'gallery'): Promise<CapturedPhoto | null> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      
      if (source === 'camera') {
        input.capture = 'environment';
      }

      input.onchange = async (event: Event) => {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (!file) {
          resolve(null);
          return;
        }

        try {
          const base64 = await this.fileToBase64(file);
          const format = file.type.split('/')[1] || 'jpeg';
          resolve({
            dataUrl: base64,
            base64: base64.split(',')[1], // Remove data URL prefix
            format
          });
        } catch {
          resolve(null);
        }
      };

      input.oncancel = () => resolve(null);
      input.click();
    });
  }

  /**
   * Convert file to base64
   */
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });
  }
}
