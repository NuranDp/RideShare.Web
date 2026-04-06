import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ReportService, REPORT_REASONS } from '../../services/report.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

export interface ReportDialogData {
  reportedUserId: string;
  reportedUserName: string;
  rideId?: string;
}

@Component({
  selector: 'app-report-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  template: `
    <div class="report-dialog">
      <!-- Close button -->
      <button class="close-btn" mat-icon-button mat-dialog-close>
        <mat-icon>close</mat-icon>
      </button>

      <!-- Header -->
      <div class="dialog-header">
        <div class="header-icon">
          <mat-icon>report_problem</mat-icon>
        </div>
        <h2>Report an Issue</h2>
        <p class="header-subtitle">Help us maintain a safe community</p>
      </div>

      <mat-dialog-content>
        <!-- User being reported -->
        <div class="reported-user-card">
          <div class="user-avatar">
            <mat-icon>person</mat-icon>
          </div>
          <div class="user-info">
            <span class="user-label">Reporting</span>
            <span class="user-name">{{ data.reportedUserName }}</span>
          </div>
        </div>

        <!-- Reason Selection -->
        <div class="reason-section">
          <label class="section-label">What happened?</label>
          <div class="reason-chips">
            @for (r of reasons; track r.value) {
              <button 
                type="button"
                class="reason-chip" 
                [class.selected]="reason === r.value"
                (click)="reason = r.value"
              >
                <mat-icon>{{ getReasonIcon(r.value) }}</mat-icon>
                {{ r.label }}
              </button>
            }
          </div>
        </div>

        <!-- Description -->
        <div class="description-section">
          <label class="section-label">Tell us more <span class="optional">(optional)</span></label>
          <textarea
            class="description-input"
            [(ngModel)]="description"
            placeholder="Share any additional details that might help us understand what happened..."
            rows="3"
            maxlength="1000"
          ></textarea>
          <span class="char-count">{{ description.length }}/1000</span>
        </div>

        <!-- Privacy notice -->
        <div class="privacy-notice">
          <mat-icon>shield</mat-icon>
          <span>Your report is confidential. The reported user won't know who filed this report.</span>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions>
        <button class="cancel-btn" type="button" mat-dialog-close [disabled]="submitting">
          Cancel
        </button>
        <button 
          class="submit-btn" 
          type="button"
          (click)="submit()" 
          [disabled]="!reason || submitting"
        >
          @if (submitting) {
            <mat-spinner diameter="18"></mat-spinner>
            Submitting...
          } @else {
            Submit Report
          }
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .report-dialog {
      position: relative;
      min-width: 360px;
      max-width: 440px;
      padding: 8px;
    }

    .close-btn {
      position: absolute;
      top: 8px;
      right: 8px;
      color: var(--text-muted);
    }

    .dialog-header {
      text-align: center;
      padding: 16px 16px 24px;
    }

    .header-icon {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16px;

      mat-icon {
        font-size: 28px;
        width: 28px;
        height: 28px;
        color: #e65100;
      }
    }

    .dialog-header h2 {
      margin: 0 0 4px;
      font-size: 20px;
      font-weight: 600;
      color: var(--text-primary);
    }

    .header-subtitle {
      margin: 0;
      font-size: 14px;
      color: var(--text-muted);
    }

    mat-dialog-content {
      padding: 0 8px !important;
    }

    .reported-user-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: var(--bg-secondary, #f8f9fa);
      border-radius: 12px;
      margin-bottom: 20px;
    }

    .user-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: var(--bg-tertiary, #e9ecef);
      display: flex;
      align-items: center;
      justify-content: center;

      mat-icon {
        color: var(--text-muted);
      }
    }

    .user-info {
      display: flex;
      flex-direction: column;
    }

    .user-label {
      font-size: 12px;
      color: var(--text-muted);
    }

    .user-name {
      font-size: 15px;
      font-weight: 500;
      color: var(--text-primary);
    }

    .section-label {
      display: block;
      font-size: 14px;
      font-weight: 500;
      color: var(--text-primary);
      margin-bottom: 12px;
    }

    .optional {
      font-weight: 400;
      color: var(--text-muted);
    }

    .reason-section {
      margin-bottom: 20px;
    }

    .reason-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .reason-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      border: 1px solid var(--border-color, #dee2e6);
      border-radius: 20px;
      background: var(--bg-card, white);
      font-size: 13px;
      color: var(--text-secondary);
      cursor: pointer;
      transition: all 0.2s ease;

      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }

      &:hover {
        border-color: var(--primary-color, #1976d2);
        background: var(--bg-secondary);
      }

      &.selected {
        border-color: var(--primary-color, #1976d2);
        background: rgba(25, 118, 210, 0.08);
        color: var(--primary-color, #1976d2);

        mat-icon {
          color: var(--primary-color, #1976d2);
        }
      }
    }

    .description-section {
      margin-bottom: 16px;
      position: relative;
    }

    .description-input {
      width: 100%;
      padding: 12px 14px;
      border: 1px solid var(--border-color, #dee2e6);
      border-radius: 12px;
      font-size: 14px;
      font-family: inherit;
      resize: none;
      background: var(--bg-card, white);
      color: var(--text-primary);
      transition: border-color 0.2s ease;
      box-sizing: border-box;

      &:focus {
        outline: none;
        border-color: var(--primary-color, #1976d2);
      }

      &::placeholder {
        color: var(--text-muted);
      }
    }

    .char-count {
      position: absolute;
      bottom: 8px;
      right: 12px;
      font-size: 11px;
      color: var(--text-muted);
    }

    .privacy-notice {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 12px 14px;
      background: #e3f2fd;
      border-radius: 10px;
      margin-bottom: 8px;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: #1976d2;
        flex-shrink: 0;
        margin-top: 1px;
      }

      span {
        font-size: 12px;
        color: #1565c0;
        line-height: 1.4;
      }
    }

    mat-dialog-actions {
      display: flex;
      gap: 12px;
      padding: 16px 8px 8px !important;
      margin: 0;
    }

    .cancel-btn {
      flex: 1;
      padding: 12px 20px;
      border: 1px solid var(--border-color, #dee2e6);
      border-radius: 10px;
      background: var(--bg-card, white);
      font-size: 14px;
      font-weight: 500;
      color: var(--text-secondary);
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover:not(:disabled) {
        background: var(--bg-secondary);
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }

    .submit-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 12px 20px;
      border: none;
      border-radius: 10px;
      background: linear-gradient(135deg, #e65100 0%, #f57c00 100%);
      font-size: 14px;
      font-weight: 500;
      color: white;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(230, 81, 0, 0.3);
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
      }

      mat-spinner {
        display: inline-block;
      }
    }
  `]
})
export class ReportDialogComponent {
  reason = '';
  description = '';
  submitting = false;
  reasons = REPORT_REASONS;

  constructor(
    public dialogRef: MatDialogRef<ReportDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ReportDialogData,
    private reportService: ReportService,
    private snackBar: MatSnackBar
  ) {}

  getReasonIcon(reason: string): string {
    const icons: Record<string, string> = {
      'inappropriate_behavior': 'sentiment_dissatisfied',
      'safety_concern': 'health_and_safety',
      'no_show': 'person_off',
      'harassment': 'warning',
      'fraud': 'gpp_bad',
      'other': 'more_horiz'
    };
    return icons[reason] || 'flag';
  }

  submit(): void {
    if (!this.reason) return;

    this.submitting = true;
    this.reportService.createReport({
      reportedUserId: this.data.reportedUserId,
      rideId: this.data.rideId,
      reason: this.reason,
      description: this.description.trim() || undefined
    }).subscribe({
      next: () => {
        this.snackBar.open('Report submitted successfully', 'Close', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.submitting = false;
        const msg = err.error?.message || 'Failed to submit report';
        this.snackBar.open(msg, 'Close', { duration: 4000 });
      }
    });
  }
}
