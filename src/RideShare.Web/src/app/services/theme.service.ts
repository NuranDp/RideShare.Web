import { Injectable, signal, effect, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_KEY = 'app_theme';
  private readonly apiUrl = `${environment.apiUrl}/auth`;
  private http = inject(HttpClient);
  private themeSignal = signal<Theme>(this.getInitialTheme());
  private isSyncing = false;
  
  theme = this.themeSignal.asReadonly();
  isDark = () => this.themeSignal() === 'dark';

  constructor() {
    // Apply theme on initialization and whenever it changes
    effect(() => {
      this.applyTheme(this.themeSignal());
    });
  }

  private getInitialTheme(): Theme {
    // Check localStorage first (includes synced user preference)
    const savedTheme = localStorage.getItem(this.THEME_KEY) as Theme;
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme;
    }
    
    // Check system preference
    if (typeof window !== 'undefined' && window.matchMedia) {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    }
    
    return 'light';
  }

  private applyTheme(theme: Theme): void {
    const body = document.body;
    if (theme === 'dark') {
      body.classList.add('dark-theme');
      body.classList.remove('light-theme');
    } else {
      body.classList.add('light-theme');
      body.classList.remove('dark-theme');
    }
    localStorage.setItem(this.THEME_KEY, theme);
  }

  // Called when user logs in to sync their preference
  syncUserTheme(userTheme: Theme | undefined): void {
    if (userTheme) {
      this.isSyncing = true;
      this.themeSignal.set(userTheme);
      this.isSyncing = false;
    }
  }

  toggleTheme(): void {
    const newTheme: Theme = this.themeSignal() === 'light' ? 'dark' : 'light';
    this.themeSignal.set(newTheme);
    this.saveThemeToServer(newTheme);
  }

  setTheme(theme: Theme): void {
    this.themeSignal.set(theme);
    this.saveThemeToServer(theme);
  }

  private saveThemeToServer(theme: Theme): void {
    if (this.isSyncing) return;
    
    const token = localStorage.getItem('auth_token');
    if (token) {
      this.http.put(`${this.apiUrl}/theme`, { theme }).subscribe({
        error: (err) => console.error('Failed to save theme preference:', err)
      });
    }
  }
}
