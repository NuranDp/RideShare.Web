import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
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
    MatSelectModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="register-container">
      <div class="register-left">
        <div class="brand-content">
          <div class="logo-icon">
            <mat-icon>two_wheeler</mat-icon>
          </div>
          <h1>Share Ride</h1>
          <p>Join the community of riders and passengers</p>
          <div class="benefits">
            <div class="benefit-item">
              <mat-icon>savings</mat-icon>
              <div>
                <strong>Save Money</strong>
                <span>Share rides, split costs</span>
              </div>
            </div>
            <div class="benefit-item">
              <mat-icon>eco</mat-icon>
              <div>
                <strong>Go Green</strong>
                <span>Reduce carbon footprint</span>
              </div>
            </div>
            <div class="benefit-item">
              <mat-icon>group</mat-icon>
              <div>
                <strong>Build Trust</strong>
                <span>Verified community members</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="register-right">
        <mat-card class="register-card">
          <mat-card-header>
            <mat-card-title>Create Account</mat-card-title>
            <mat-card-subtitle>Start your journey with Share Ride</mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
              @if (errorMessage()) {
                <div class="error-message">
                  <mat-icon>error_outline</mat-icon>
                  {{ errorMessage() }}
                </div>
              }

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Full Name</mat-label>
                <input matInput formControlName="fullName" placeholder="Enter your full name">
                <mat-icon matSuffix>person</mat-icon>
                @if (registerForm.get('fullName')?.hasError('required') && registerForm.get('fullName')?.touched) {
                  <mat-error>Full name is required</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Email</mat-label>
                <input matInput type="email" formControlName="email" placeholder="Enter your email">
                <mat-icon matSuffix>email</mat-icon>
                @if (registerForm.get('email')?.hasError('required') && registerForm.get('email')?.touched) {
                  <mat-error>Email is required</mat-error>
                }
                @if (registerForm.get('email')?.hasError('email') && registerForm.get('email')?.touched) {
                  <mat-error>Please enter a valid email</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Phone (Optional)</mat-label>
                <input matInput formControlName="phone" placeholder="Enter your phone number">
                <mat-icon matSuffix>phone</mat-icon>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Password</mat-label>
                <input matInput [type]="hidePassword() ? 'password' : 'text'" formControlName="password" placeholder="Create a password">
                <button mat-icon-button matSuffix type="button" (click)="hidePassword.set(!hidePassword())">
                  <mat-icon>{{ hidePassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
                @if (registerForm.get('password')?.hasError('required') && registerForm.get('password')?.touched) {
                  <mat-error>Password is required</mat-error>
                }
                @if (registerForm.get('password')?.hasError('minlength') && registerForm.get('password')?.touched) {
                  <mat-error>Password must be at least 6 characters</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>I want to</mat-label>
                <mat-select formControlName="role">
                  <mat-option value="Passenger">
                    <mat-icon>person</mat-icon>
                    Find rides (Passenger)
                  </mat-option>
                  <mat-option value="Rider">
                    <mat-icon>two_wheeler</mat-icon>
                    Offer rides (Rider)
                  </mat-option>
                </mat-select>
                @if (registerForm.get('role')?.hasError('required') && registerForm.get('role')?.touched) {
                  <mat-error>Please select a role</mat-error>
                }
              </mat-form-field>

              <button mat-raised-button type="submit" class="full-width submit-btn" [disabled]="isLoading() || registerForm.invalid">
                @if (isLoading()) {
                  <mat-spinner diameter="20"></mat-spinner>
                } @else {
                  <ng-container>
                    <mat-icon>person_add</mat-icon>
                    Create Account
                  </ng-container>
                }
              </button>
            </form>
          </mat-card-content>

          <mat-card-actions>
            <p class="login-link">
              Already have an account? <a routerLink="/login">Sign in here</a>
            </p>
          </mat-card-actions>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .register-container {
      display: flex;
      min-height: 100vh;
    }

    .register-left {
      flex: 1;
      background: linear-gradient(135deg, #034694 0%, #0A56A4 50%, #1565C0 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px;
      position: relative;
      overflow: hidden;
    }

    .register-left::before {
      content: '';
      position: absolute;
      top: -50%;
      right: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 60%);
      animation: float 20s ease-in-out infinite;
    }

    @keyframes float {
      0%, 100% { transform: translate(0, 0) rotate(0deg); }
      50% { transform: translate(-5%, 5%) rotate(5deg); }
    }

    .brand-content {
      position: relative;
      z-index: 1;
      text-align: center;
      color: white;
      max-width: 400px;
    }

    .logo-icon {
      width: 90px;
      height: 90px;
      background: rgba(255,255,255,0.15);
      border-radius: 22px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.2);
    }

    .logo-icon mat-icon {
      font-size: 50px;
      width: 50px;
      height: 50px;
    }

    .brand-content h1 {
      font-size: 38px;
      font-weight: 700;
      margin: 0 0 8px;
      letter-spacing: -1px;
    }

    .brand-content > p {
      font-size: 16px;
      opacity: 0.9;
      margin: 0 0 40px;
    }

    .benefits {
      display: flex;
      flex-direction: column;
      gap: 14px;
      text-align: left;
    }

    .benefit-item {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 14px 18px;
      background: rgba(255,255,255,0.1);
      border-radius: 12px;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.15);
      transition: all 0.3s;
    }

    .benefit-item:hover {
      background: rgba(255,255,255,0.18);
      transform: translateX(6px);
    }

    .benefit-item mat-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
      flex-shrink: 0;
    }

    .benefit-item div {
      display: flex;
      flex-direction: column;
    }

    .benefit-item strong {
      font-size: 15px;
      font-weight: 600;
    }

    .benefit-item span {
      font-size: 13px;
      opacity: 0.85;
    }

    .register-right {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f8fafc;
      padding: 40px;
      overflow-y: auto;
    }

    .register-card {
      width: 100%;
      max-width: 440px;
      padding: 28px;
      border-radius: 20px !important;
      box-shadow: 0 10px 40px rgba(3, 70, 148, 0.1) !important;
    }

    mat-card-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 24px;
      padding: 0;
    }

    mat-card-title {
      font-size: 26px !important;
      font-weight: 700 !important;
      color: #034694 !important;
      margin-bottom: 6px;
    }

    mat-card-subtitle {
      font-size: 14px !important;
      color: #64748b !important;
    }

    .full-width {
      width: 100%;
    }

    mat-form-field {
      margin-bottom: 4px;
    }

    .submit-btn {
      margin-top: 12px;
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
      padding: 12px;
      border-radius: 10px;
      margin-bottom: 16px;
      font-weight: 500;
      border: 1px solid #fecaca;
    }

    .error-message mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .login-link {
      text-align: center;
      width: 100%;
      margin: 0;
      color: #64748b;
    }

    .login-link a {
      color: #034694;
      font-weight: 600;
      text-decoration: none;
    }

    .login-link a:hover {
      color: #022B5A;
      text-decoration: underline;
    }

    mat-card-actions {
      justify-content: center;
      padding: 16px 0 0 0 !important;
      margin: 0 !important;
    }

    /* Responsive */
    @media (max-width: 900px) {
      .register-container {
        flex-direction: column;
      }

      .register-left {
        padding: 32px 24px;
        min-height: 280px;
      }

      .brand-content h1 {
        font-size: 30px;
      }

      .benefits {
        flex-direction: row;
        flex-wrap: wrap;
        justify-content: center;
        gap: 10px;
      }

      .benefit-item {
        padding: 10px 14px;
      }

      .benefit-item div {
        display: none;
      }

      .register-right {
        padding: 24px;
      }

      .register-card {
        padding: 20px;
      }
    }
  `]
})
export class RegisterComponent {
  registerForm: FormGroup;
  hidePassword = signal(true);
  isLoading = signal(false);
  errorMessage = signal('');

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      fullName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['', [Validators.required]]
    });
  }

  onSubmit(): void {
    if (this.registerForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.authService.register(this.registerForm.value).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        // Navigate based on role
        if (response.user.role === 'Rider') {
          this.router.navigate(['/rider']);
        } else {
          this.router.navigate(['/passenger']);
        }
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(error.error?.message || 'Registration failed. Please try again.');
      }
    });
  }
}
