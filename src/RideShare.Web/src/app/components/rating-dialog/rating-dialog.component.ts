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
  templateUrl: './rating-dialog.component.html',
  styleUrls: ['./rating-dialog.component.scss']
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
