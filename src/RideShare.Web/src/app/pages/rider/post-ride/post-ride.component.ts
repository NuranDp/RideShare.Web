import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MatRippleModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { RideService } from '../../../services/ride.service';
import { CreateRideRequest } from '../../../models/ride.model';
import { UnifiedRouteMapComponent, LocationCoordinates, RouteInfo } from '../../../components/unified-route-map/unified-route-map.component';


@Component({
  selector: 'app-post-ride',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCheckboxModule,
    MatRippleModule,
    UnifiedRouteMapComponent
  ],
  templateUrl: './post-ride.component.html',
  styleUrls: ['./post-ride.component.scss']
})
export class PostRideComponent implements OnInit {
  rideForm!: FormGroup;
  loading = false;
  minDate = new Date();
  
  originLocation: LocationCoordinates | null = null;
  destLocation: LocationCoordinates | null = null;
  routeInfo: RouteInfo | null = null;

  constructor(
    private fb: FormBuilder,
    private rideService: RideService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    this.rideForm = this.fb.group({
      origin: [''],
      destination: [''],
      departureDate: [new Date(), Validators.required],
      departureTime: [timeStr, Validators.required],
      helmetProvided: [false],
      notes: ['']
    });
  }

  toggleHelmet(): void {
    const current = this.rideForm.get('helmetProvided')?.value;
    this.rideForm.patchValue({ helmetProvided: !current });
  }

  onOriginSelected(location: LocationCoordinates): void {
    this.originLocation = location;
    this.rideForm.patchValue({ origin: location.address });
  }

  onDestSelected(location: LocationCoordinates): void {
    this.destLocation = location;
    this.rideForm.patchValue({ destination: location.address });
  }

  onRouteCalculated(routeInfo: RouteInfo): void {
    this.routeInfo = routeInfo;
  }

  onSubmit(): void {
    if (this.rideForm.invalid || !this.originLocation || !this.destLocation) return;

    this.loading = true;

    const formValue = this.rideForm.value;
    const departureDate = new Date(formValue.departureDate);
    const [hours, minutes] = formValue.departureTime.split(':');
    departureDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    const request: CreateRideRequest = {
      origin: this.originLocation.address || '',
      destination: this.destLocation.address || '',
      originLat: this.originLocation.lat,
      originLng: this.originLocation.lng,
      destLat: this.destLocation.lat,
      destLng: this.destLocation.lng,
      departureTime: departureDate.toISOString(),
      helmetProvided: formValue.helmetProvided,
      notes: formValue.notes || undefined
    };

    this.rideService.createRide(request).subscribe({
      next: () => {
        this.loading = false;
        this.snackBar.open('Ride posted successfully!', 'Close', { duration: 3000 });
        this.router.navigate(['/rider/my-rides']);
      },
      error: (err) => {
        this.loading = false;
        const message = err.error?.message || 'Failed to post ride. Make sure your license is verified.';
        this.snackBar.open(message, 'Close', { duration: 5000 });
      }
    });
  }
}
