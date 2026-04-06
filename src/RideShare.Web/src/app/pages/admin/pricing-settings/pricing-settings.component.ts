import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AdminService } from '../../../services/admin.service';
import { PricingSettings, UpdatePricingSettingsRequest } from '../../../models/pricing.model';

@Component({
  selector: 'app-pricing-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDividerModule,
    MatTooltipModule
  ],
  template: `
    <div class="admin-page">
      <!-- Header -->
      <header class="page-header">
        <div class="header-left">
          <button class="back-btn" routerLink="/admin">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div class="header-info">
            <h1>Pricing Settings</h1>
            <p>Configure ride fare calculations</p>
          </div>
        </div>
        <div class="header-badge" [class.enabled]="settings()?.isEnabled">
          <mat-icon>{{ settings()?.isEnabled ? 'check_circle' : 'remove_circle' }}</mat-icon>
          {{ settings()?.isEnabled ? 'Pricing Enabled' : 'Pricing Disabled' }}
        </div>
      </header>

      @if (loading()) {
        <div class="loading-state">
          <mat-spinner diameter="40"></mat-spinner>
          <p>Loading settings...</p>
        </div>
      } @else if (settings()) {
        <div class="page-content">
          <!-- Pricing Toggle -->
          <mat-card class="settings-card toggle-card">
            <div class="toggle-row">
              <div class="toggle-info">
                <mat-icon [class.enabled]="settings()!.isEnabled">payments</mat-icon>
                <div>
                  <h3>Enable Pricing</h3>
                  <p>When disabled, rides will show "Fare to negotiate" instead of calculated fares</p>
                </div>
              </div>
              <mat-slide-toggle 
                [(ngModel)]="settings()!.isEnabled"
                (change)="markDirty()"
                color="primary"
              ></mat-slide-toggle>
            </div>
          </mat-card>

          <!-- Fare Configuration -->
          <mat-card class="settings-card" [class.disabled]="!settings()!.isEnabled">
            <mat-card-header>
              <mat-icon mat-card-avatar>calculate</mat-icon>
              <mat-card-title>Fare Calculation</mat-card-title>
              <mat-card-subtitle>Formula: Base Fare + (Distance × Per KM Rate)</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="form-grid">
                <mat-form-field appearance="outline">
                  <mat-label>Base Fare</mat-label>
                  <input matInput type="number" [(ngModel)]="settings()!.baseFare" (input)="markDirty()" min="0" step="0.5">
                  <span matPrefix>{{ settings()!.currencySymbol }}&nbsp;</span>
                  <mat-hint>Flat fee for every ride</mat-hint>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Per KM Rate</mat-label>
                  <input matInput type="number" [(ngModel)]="settings()!.perKmRate" (input)="markDirty()" min="0" step="0.5">
                  <span matPrefix>{{ settings()!.currencySymbol }}&nbsp;</span>
                  <mat-hint>Amount charged per kilometer</mat-hint>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Minimum Fare</mat-label>
                  <input matInput type="number" [(ngModel)]="settings()!.minimumFare" (input)="markDirty()" min="0" step="0.5">
                  <span matPrefix>{{ settings()!.currencySymbol }}&nbsp;</span>
                  <mat-hint>Minimum fare regardless of distance</mat-hint>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Maximum Fare</mat-label>
                  <input matInput type="number" [(ngModel)]="settings()!.maximumFare" (input)="markDirty()" min="0" step="0.5">
                  <span matPrefix>{{ settings()!.currencySymbol }}&nbsp;</span>
                  <mat-hint>Cap on fare (0 = no cap)</mat-hint>
                </mat-form-field>
              </div>

              <!-- Fare Preview -->
              <div class="preview-section">
                <h4>Preview</h4>
                <div class="preview-examples">
                  <div class="example">
                    <span class="distance">5 km ride</span>
                    <span class="fare">{{ settings()!.currencySymbol }}{{ calculatePreview(5) | number:'1.2-2' }}</span>
                  </div>
                  <div class="example">
                    <span class="distance">10 km ride</span>
                    <span class="fare">{{ settings()!.currencySymbol }}{{ calculatePreview(10) | number:'1.2-2' }}</span>
                  </div>
                  <div class="example">
                    <span class="distance">20 km ride</span>
                    <span class="fare">{{ settings()!.currencySymbol }}{{ calculatePreview(20) | number:'1.2-2' }}</span>
                  </div>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Currency Settings -->
          <mat-card class="settings-card">
            <mat-card-header>
              <mat-icon mat-card-avatar>language</mat-icon>
              <mat-card-title>Currency</mat-card-title>
              <mat-card-subtitle>Display settings for fares</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="form-row">
                <mat-form-field appearance="outline">
                  <mat-label>Currency Code</mat-label>
                  <input matInput [(ngModel)]="settings()!.currency" (input)="markDirty()" maxlength="5">
                  <mat-hint>e.g., PHP, USD, EUR</mat-hint>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Currency Symbol</mat-label>
                  <input matInput [(ngModel)]="settings()!.currencySymbol" (input)="markDirty()" maxlength="3">
                  <mat-hint>e.g., ₱, $, €</mat-hint>
                </mat-form-field>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Platform Fee -->
          <mat-card class="settings-card">
            <mat-card-header>
              <mat-icon mat-card-avatar>account_balance</mat-icon>
              <mat-card-title>Platform Fee</mat-card-title>
              <mat-card-subtitle>Commission deducted from rider earnings</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="form-row single">
                <mat-form-field appearance="outline">
                  <mat-label>Platform Fee Percentage</mat-label>
                  <input matInput type="number" [(ngModel)]="settings()!.platformFeePercent" (input)="markDirty()" min="0" max="100" step="0.5">
                  <span matSuffix>&nbsp;%</span>
                  <mat-hint>0-100% platform commission</mat-hint>
                </mat-form-field>
              </div>
              
              @if (settings()!.platformFeePercent > 0) {
                <div class="fee-preview">
                  <mat-icon>info</mat-icon>
                  <span>For a {{ settings()!.currencySymbol }}100 ride, platform takes {{ settings()!.currencySymbol }}{{ settings()!.platformFeePercent | number:'1.2-2' }}, rider earns {{ settings()!.currencySymbol }}{{ (100 - settings()!.platformFeePercent) | number:'1.2-2' }}</span>
                </div>
              }
            </mat-card-content>
          </mat-card>

          <!-- Save Button -->
          <div class="actions-bar" [class.visible]="isDirty()">
            <div class="actions-content">
              <span>You have unsaved changes</span>
              <div class="btn-group">
                <button mat-button (click)="loadSettings()" [disabled]="saving()">Cancel</button>
                <button mat-raised-button color="primary" (click)="saveSettings()" [disabled]="saving()">
                  @if (saving()) {
                    <mat-spinner diameter="20"></mat-spinner>
                  } @else {
                    <ng-container>
                      <mat-icon>save</mat-icon>
                      Save Changes
                    </ng-container>
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .admin-page {
      min-height: 100vh;
      background: #f8fafc;
      padding-bottom: 100px;
    }

    .page-header {
      background: white;
      padding: 20px 24px;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .back-btn {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      border: 1px solid #e2e8f0;
      background: white;
      color: #64748b;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;

      &:hover {
        border-color: #3b82f6;
        color: #3b82f6;
        background: #eff6ff;
      }
    }

    .header-info h1 {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
      color: #0f172a;
    }

    .header-info p {
      margin: 4px 0 0;
      font-size: 13px;
      color: #64748b;
    }

    .header-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 500;
      background: #fef2f2;
      color: #dc2626;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      &.enabled {
        background: #dcfce7;
        color: #16a34a;
      }
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 80px 20px;
      gap: 16px;

      p {
        font-size: 14px;
        color: #64748b;
      }
    }

    .page-content {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      max-width: 640px;
      margin: 0 auto;
    }

    .settings-card {
      background: white;
      border-radius: 16px;
      border: 1px solid #e2e8f0;
      overflow: hidden;

      &.disabled {
        opacity: 0.5;
        pointer-events: none;
      }

      mat-card-header {
        mat-icon[mat-card-avatar] {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
        }
      }

      mat-card-content {
        padding-top: 16px;
      }
    }

    .toggle-card {
      padding: 20px;
    }

    .toggle-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }

    .toggle-info {
      display: flex;
      align-items: center;
      gap: 16px;

      mat-icon {
        font-size: 32px;
        width: 32px;
        height: 32px;
        color: #94a3b8;

        &.enabled {
          color: #10b981;
        }
      }

      h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: #0f172a;
      }

      p {
        margin: 4px 0 0;
        font-size: 13px;
        color: #64748b;
      }
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }

    .form-row {
      display: flex;
      gap: 16px;

      &.single {
        max-width: 280px;
      }

      mat-form-field {
        flex: 1;
      }
    }

    .preview-section {
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;

      h4 {
        margin: 0 0 12px;
        font-size: 14px;
        font-weight: 500;
        color: #64748b;
      }
    }

    .preview-examples {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    .example {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 12px 20px;
      background: #f8fafc;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      min-width: 100px;

      .distance {
        font-size: 12px;
        color: #64748b;
      }

      .fare {
        font-size: 18px;
        font-weight: 600;
        color: #3b82f6;
      }
    }

    .fee-preview {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 16px;
      padding: 12px;
      background: #eff6ff;
      border-radius: 10px;
      font-size: 13px;
      color: #2563eb;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    }

    .actions-bar {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: white;
      border-top: 1px solid #e2e8f0;
      padding: 16px 24px;
      transform: translateY(100%);
      transition: transform 0.3s ease;
      z-index: 100;
      box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.1);

      &.visible {
        transform: translateY(0);
      }
    }

    .actions-content {
      max-width: 640px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;

      > span {
        font-size: 14px;
        color: #64748b;
      }
    }

    .btn-group {
      display: flex;
      gap: 12px;

      button {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      button[mat-raised-button] {
        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%) !important;
      }
    }

    @media (max-width: 600px) {
      .page-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
        padding: 16px;
      }

      .header-left {
        gap: 12px;
      }

      .back-btn {
        width: 36px;
        height: 36px;
      }

      .header-info h1 {
        font-size: 18px;
      }

      .header-info p {
        font-size: 12px;
      }

      .header-badge {
        padding: 6px 12px;
        font-size: 12px;
      }

      .page-content {
        padding: 16px;
      }

      .settings-card {
        border-radius: 12px;
      }

      .toggle-card {
        padding: 16px;
      }

      .toggle-info {
        gap: 12px;

        mat-icon {
          font-size: 28px;
          width: 28px;
          height: 28px;
        }

        h3 {
          font-size: 15px;
        }

        p {
          font-size: 12px;
        }
      }

      .form-grid {
        grid-template-columns: 1fr;
      }

      .form-row {
        flex-direction: column;

        &.single {
          max-width: none;
        }
      }

      .preview-section h4 {
        font-size: 13px;
      }

      .preview-examples {
        justify-content: center;
        gap: 8px;
      }

      .example {
        padding: 10px 16px;
        min-width: 80px;

        .distance {
          font-size: 11px;
        }

        .fare {
          font-size: 16px;
        }
      }

      .fee-preview {
        font-size: 12px;
        padding: 10px;
      }

      .actions-bar {
        padding: 12px 16px;
      }

      .actions-content {
        flex-direction: column;
        gap: 12px;
        text-align: center;

        > span {
          font-size: 13px;
        }
      }

      .btn-group {
        width: 100%;
        justify-content: center;
      }
    }
  `]
})
export class PricingSettingsComponent implements OnInit {
  settings = signal<PricingSettings | null>(null);
  loading = signal(true);
  saving = signal(false);
  isDirty = signal(false);
  
  private originalSettings: string = '';

  constructor(
    private adminService: AdminService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadSettings();
  }

  loadSettings(): void {
    this.loading.set(true);
    this.isDirty.set(false);
    
    this.adminService.getPricingSettings().subscribe({
      next: (settings) => {
        this.settings.set(settings);
        this.originalSettings = JSON.stringify(settings);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load pricing settings:', err);
        this.snackBar.open('Failed to load pricing settings', 'Close', { duration: 4000 });
        this.loading.set(false);
      }
    });
  }

  markDirty(): void {
    if (this.settings()) {
      const current = JSON.stringify(this.settings());
      this.isDirty.set(current !== this.originalSettings);
    }
  }

  calculatePreview(distanceKm: number): number {
    const s = this.settings();
    if (!s) return 0;
    
    let fare = s.baseFare + (distanceKm * s.perKmRate);
    fare = Math.max(fare, s.minimumFare);
    if (s.maximumFare > 0) {
      fare = Math.min(fare, s.maximumFare);
    }
    return fare;
  }

  saveSettings(): void {
    if (!this.settings() || this.saving()) return;

    this.saving.set(true);
    const s = this.settings()!;
    
    const request: UpdatePricingSettingsRequest = {
      baseFare: s.baseFare,
      perKmRate: s.perKmRate,
      minimumFare: s.minimumFare,
      maximumFare: s.maximumFare,
      currency: s.currency,
      currencySymbol: s.currencySymbol,
      isEnabled: s.isEnabled,
      platformFeePercent: s.platformFeePercent
    };

    this.adminService.updatePricingSettings(request).subscribe({
      next: (updated) => {
        this.settings.set(updated);
        this.originalSettings = JSON.stringify(updated);
        this.isDirty.set(false);
        this.saving.set(false);
        this.snackBar.open('Pricing settings saved successfully', 'Close', { duration: 3000 });
      },
      error: (err) => {
        console.error('Failed to save pricing settings:', err);
        const msg = err.error?.message || 'Failed to save settings';
        this.snackBar.open(msg, 'Close', { duration: 4000 });
        this.saving.set(false);
      }
    });
  }
}
