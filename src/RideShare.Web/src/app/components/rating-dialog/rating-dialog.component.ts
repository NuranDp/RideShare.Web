import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

export interface RatingDialogData {
  rideId: string;
  riderName: string;
  origin: string;
  destination: string;
}

@Component({
  selector: 'app-rating-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>star</mat-icon>
      Rate Your Ride
    </h2>
    
    <mat-dialog-content>
      <div class="ride-info">
        <p><strong>Rider:</strong> {{ data.riderName }}</p>
        <p><strong>Route:</strong> {{ data.origin }} → {{ data.destination }}</p>
      </div>

      <div class="rating-stars">
        <p>How was your experience?</p>
        <div class="stars">
          @for (star of [1, 2, 3, 4, 5]; track star) {
            <button 
              mat-icon-button 
              (click)="setRating(star)"
              [class.active]="star <= rating"
              type="button">
              <mat-icon>{{ star <= rating ? 'star' : 'star_border' }}</mat-icon>
            </button>
          }
        </div>
        <p class="rating-label">{{ getRatingLabel() }}</p>
      </div>

      <mat-form-field appearance="outline" class="comment-field">
        <mat-label>Comment (optional)</mat-label>
        <textarea 
          matInput 
          [(ngModel)]="comment" 
          rows="3" 
          maxlength="500"
          placeholder="Share your experience...">
        </textarea>
        <mat-hint>{{ comment.length }}/500</mat-hint>
      </mat-form-field>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close [disabled]="submitting">Cancel</button>
      <button 
        mat-raised-button 
        color="primary" 
        (click)="submit()"
        [disabled]="rating === 0 || submitting">
        @if (submitting) {
          <mat-spinner diameter="20"></mat-spinner>
        } @else {
          <mat-icon>send</mat-icon>
          Submit Rating
        }
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    h2 {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    h2 mat-icon {
      color: #ffc107;
    }

    .ride-info {
      background: #f5f5f5;
      padding: 12px 16px;
      border-radius: 8px;
      margin-bottom: 16px;
    }

    .ride-info p {
      margin: 4px 0;
    }

    .rating-stars {
      text-align: center;
      margin: 16px 0;
    }

    .rating-stars > p:first-child {
      margin-bottom: 8px;
      color: #666;
    }

    .stars {
      display: flex;
      justify-content: center;
      gap: 4px;
    }

    .stars button mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: #ccc;
      transition: color 0.2s, transform 0.2s;
    }

    .stars button.active mat-icon {
      color: #ffc107;
    }

    .stars button:hover mat-icon {
      transform: scale(1.2);
    }

    .rating-label {
      margin-top: 8px;
      font-weight: 500;
      color: #1976d2;
      min-height: 24px;
    }

    .comment-field {
      width: 100%;
      margin-top: 16px;
    }

    mat-dialog-actions button mat-spinner {
      display: inline-block;
    }
  `]
})
export class RatingDialogComponent {
  rating = 0;
  comment = '';
  submitting = false;

  constructor(
    public dialogRef: MatDialogRef<RatingDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: RatingDialogData
  ) {}

  setRating(value: number): void {
    this.rating = value;
  }

  getRatingLabel(): string {
    const labels: { [key: number]: string } = {
      1: 'Poor',
      2: 'Fair',
      3: 'Good',
      4: 'Very Good',
      5: 'Excellent!'
    };
    return labels[this.rating] || '';
  }

  submit(): void {
    if (this.rating === 0) return;
    
    this.dialogRef.close({
      score: this.rating,
      comment: this.comment.trim() || undefined
    });
  }
}
