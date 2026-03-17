import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="login-container">
      <div class="login-left">
        <div class="brand-content">
          <div class="logo-icon">
            <mat-icon>two_wheeler</mat-icon>
          </div>
          <h1>Share Ride</h1>
          <p>Your journey, shared together</p>
          <div class="features">
            <div class="feature-item">
              <mat-icon>verified_user</mat-icon>
              <span>Verified Riders</span>
            </div>
            <div class="feature-item">
              <mat-icon>location_on</mat-icon>
              <span>Live Tracking</span>
            </div>
            <div class="feature-item">
              <mat-icon>people</mat-icon>
              <span>Community Trust</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="login-right">
        <mat-card class="login-card">
          <mat-card-header>
            <mat-card-title>Welcome Back</mat-card-title>
            <mat-card-subtitle>Sign in to continue your journey</mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
              @if (errorMessage()) {
                <div class="error-message">
                  <mat-icon>error_outline</mat-icon>
                  {{ errorMessage() }}
                </div>
              }

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Email</mat-label>
                <input matInput type="email" formControlName="email" placeholder="Enter your email">
                <mat-icon matSuffix>email</mat-icon>
                @if (loginForm.get('email')?.hasError('required') && loginForm.get('email')?.touched) {
                  <mat-error>Email is required</mat-error>
                }
                @if (loginForm.get('email')?.hasError('email') && loginForm.get('email')?.touched) {
                  <mat-error>Please enter a valid email</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Password</mat-label>
                <input matInput [type]="hidePassword() ? 'password' : 'text'" formControlName="password" placeholder="Enter your password">
                <button mat-icon-button matSuffix type="button" (click)="hidePassword.set(!hidePassword())">
                  <mat-icon>{{ hidePassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
                @if (loginForm.get('password')?.hasError('required') && loginForm.get('password')?.touched) {
                  <mat-error>Password is required</mat-error>
                }
              </mat-form-field>

              <button mat-raised-button type="submit" class="full-width submit-btn" [disabled]="isLoading() || loginForm.invalid">
                @if (isLoading()) {
                  <mat-spinner diameter="20"></mat-spinner>
                } @else {
                  <ng-container>
                    <mat-icon>login</mat-icon>
                    Sign In
                  </ng-container>
                }
              </button>
            </form>
          </mat-card-content>

          <mat-card-actions>
            <p class="register-link">
              Don't have an account? <a routerLink="/register">Create Account</a>
            </p>
          </mat-card-actions>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      min-height: 100vh;
    }

    .login-left {
      flex: 1;
      background: linear-gradient(135deg, #034694 0%, #0A56A4 50%, #1565C0 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px;
      position: relative;
      overflow: hidden;
    }

    .login-left::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 60%);
      animation: pulse 15s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { transform: translate(0, 0); }
      50% { transform: translate(10%, 10%); }
    }

    .brand-content {
      position: relative;
      z-index: 1;
      text-align: center;
      color: white;
    }

    .logo-icon {
      width: 100px;
      height: 100px;
      background: rgba(255,255,255,0.15);
      border-radius: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.2);
    }

    .logo-icon mat-icon {
      font-size: 56px;
      width: 56px;
      height: 56px;
    }

    .brand-content h1 {
      font-size: 42px;
      font-weight: 700;
      margin: 0 0 8px;
      letter-spacing: -1px;
    }

    .brand-content > p {
      font-size: 18px;
      opacity: 0.9;
      margin: 0 0 48px;
    }

    .features {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .feature-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 24px;
      background: rgba(255,255,255,0.1);
      border-radius: 12px;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.15);
      transition: all 0.3s;
    }

    .feature-item:hover {
      background: rgba(255,255,255,0.2);
      transform: translateX(8px);
    }

    .feature-item mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .feature-item span {
      font-size: 16px;
      font-weight: 500;
    }

    .login-right {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f8fafc;
      padding: 40px;
    }

    .login-card {
      width: 100%;
      max-width: 420px;
      padding: 32px;
      border-radius: 20px !important;
      box-shadow: 0 10px 40px rgba(3, 70, 148, 0.1) !important;
    }

    mat-card-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 28px;
      padding: 0;
    }

    mat-card-title {
      font-size: 28px !important;
      font-weight: 700 !important;
      color: #034694 !important;
      margin-bottom: 8px;
    }

    mat-card-subtitle {
      font-size: 15px !important;
      color: #64748b !important;
    }

    .full-width {
      width: 100%;
    }

    mat-form-field {
      margin-bottom: 8px;
    }

    .submit-btn {
      margin-top: 16px;
      height: 52px;
      font-size: 16px;
      font-weight: 600;
      border-radius: 12px !important;
      background: linear-gradient(135deg, #034694 0%, #0A56A4 100%) !important;
      color: white !important;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all 0.3s;
    }

    .submit-btn:not(:disabled):hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(3, 70, 148, 0.35);
    }

    .submit-btn:disabled {
      background: #cbd5e1 !important;
    }

    .submit-btn mat-icon {
      font-size: 22px;
      width: 22px;
      height: 22px;
    }

    .error-message {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      background: linear-gradient(135deg, #fef2f2, #fee2e2);
      color: #dc2626;
      padding: 14px;
      border-radius: 12px;
      margin-bottom: 20px;
      font-weight: 500;
      border: 1px solid #fecaca;
    }

    .error-message mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .register-link {
      text-align: center;
      width: 100%;
      margin: 0;
      color: #64748b;
    }

    .register-link a {
      color: #034694;
      font-weight: 600;
      text-decoration: none;
      transition: color 0.2s;
    }

    .register-link a:hover {
      color: #022B5A;
      text-decoration: underline;
    }

    mat-card-actions {
      justify-content: center;
      padding: 20px 0 0 0 !important;
      margin: 0 !important;
    }

    /* Responsive */
    @media (max-width: 900px) {
      .login-container {
        flex-direction: column;
      }

      .login-left {
        padding: 40px 24px;
        min-height: 300px;
      }

      .brand-content h1 {
        font-size: 32px;
      }

      .features {
        flex-direction: row;
        flex-wrap: wrap;
        justify-content: center;
      }

      .feature-item {
        padding: 10px 16px;
      }

      .feature-item span {
        display: none;
      }

      .login-right {
        padding: 24px;
      }

      .login-card {
        padding: 24px;
      }
    }
  `]
})
export class LoginComponent {
  loginForm: FormGroup;
  hidePassword = signal(true);
  isLoading = signal(false);
  errorMessage = signal('');

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.authService.login(this.loginForm.value).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        // Navigate based on role
        if (response.user.role === 'Admin') {
          this.router.navigate(['/admin']);
        } else if (response.user.role === 'Rider') {
          this.router.navigate(['/rider']);
        } else {
          this.router.navigate(['/passenger']);
        }
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(error.error?.message || 'Login failed. Please try again.');
      }
    });
  }
}
