import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-emergency-contact',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './emergency-contact.component.html',
  styleUrls: ['./emergency-contact.component.scss']
})
export class EmergencyContactComponent implements OnInit {
  loading = signal(false);
  saving = signal(false);
  contactForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    public authService: AuthService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    this.contactForm = this.fb.group({
      name: [''],
      phone: [''],
      relation: ['']
    });
  }

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (user?.emergencyContact) {
      this.contactForm.patchValue({
        name: user.emergencyContact.name || '',
        phone: user.emergencyContact.phone || '',
        relation: user.emergencyContact.relation || ''
      });
      this.contactForm.markAsPristine();
    }
  }

  saveContact(): void {
    if (!this.contactForm.dirty) return;

    this.saving.set(true);
    this.authService.updateEmergencyContact(this.contactForm.value).subscribe({
      next: () => {
        this.contactForm.markAsPristine();
        this.saving.set(false);
        this.snackBar.open('Emergency contact saved successfully!', 'Close', { duration: 3000 });
      },
      error: (err) => {
        console.error('Error saving emergency contact:', err);
        this.snackBar.open('Failed to save emergency contact', 'Close', { duration: 3000 });
        this.saving.set(false);
      }
    });
  }

  goBack(): void {
    const user = this.authService.currentUser();
    if (user?.role === 'Rider') {
      this.router.navigate(['/rider'], { queryParams: { tab: 'profile' } });
    } else {
      this.router.navigate(['/passenger'], { queryParams: { tab: 'profile' } });
    }
  }

  hasContact(): boolean {
    const user = this.authService.currentUser();
    return !!(user?.emergencyContact?.name || user?.emergencyContact?.phone);
  }
}
