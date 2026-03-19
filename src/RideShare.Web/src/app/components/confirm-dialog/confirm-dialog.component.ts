import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: 'primary' | 'warn' | 'accent';
  icon?: string;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="confirm-dialog">
      <div class="dialog-header">
        @if (data.icon) {
          <div class="dialog-icon" [class]="data.confirmColor || 'warn'">
            <mat-icon>{{ data.icon }}</mat-icon>
          </div>
        }
        <h2>{{ data.title }}</h2>
      </div>
      
      <div class="dialog-content">
        <p>{{ data.message }}</p>
      </div>
      
      <div class="dialog-actions">
        <button class="btn-cancel" (click)="onCancel()">
          {{ data.cancelText || 'Cancel' }}
        </button>
        <button class="btn-confirm" [class]="data.confirmColor || 'warn'" (click)="onConfirm()">
          {{ data.confirmText || 'Confirm' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
    
    .confirm-dialog {
      padding: 24px;
      max-width: 320px;
      background: var(--bg-card);
      border-radius: 16px;
    }
    
    .dialog-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      margin-bottom: 16px;
    }
    
    .dialog-icon {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 16px;
    }
    
    .dialog-icon.warn {
      background: var(--danger-bg);
      color: var(--danger);
    }
    
    .dialog-icon.primary {
      background: var(--primary-shadow-light);
      color: var(--primary);
    }
    
    .dialog-icon.accent {
      background: var(--warning-bg);
      color: var(--warning);
    }
    
    .dialog-icon mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
    }
    
    .dialog-header h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
      color: var(--text-primary);
    }
    
    .dialog-content {
      margin-bottom: 24px;
    }
    
    .dialog-content p {
      margin: 0;
      text-align: center;
      color: var(--text-secondary);
      font-size: 14px;
      line-height: 1.6;
    }
    
    .dialog-actions {
      display: flex;
      gap: 12px;
      justify-content: center;
    }
    
    .dialog-actions button {
      flex: 1;
      padding: 12px 20px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .btn-cancel {
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      color: var(--text-primary);
    }
    
    .btn-cancel:hover {
      background: var(--bg-hover);
    }
    
    .btn-confirm {
      border: none;
      color: white;
    }
    
    .btn-confirm.warn {
      background: linear-gradient(135deg, #f44336 0%, #c62828 100%);
    }
    
    .btn-confirm.warn:hover {
      background: linear-gradient(135deg, #e53935 0%, #b71c1c 100%);
    }
    
    .btn-confirm.primary {
      background: var(--primary-gradient-simple);
    }
    
    .btn-confirm.primary:hover {
      opacity: 0.9;
    }
    
    .btn-confirm.accent {
      background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
    }
    
    .btn-confirm.accent:hover {
      background: linear-gradient(135deg, #ffa726 0%, #ef6c00 100%);
    }
  `]
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {}

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}
