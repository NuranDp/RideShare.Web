import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
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
import * as L from 'leaflet';

@Component({
  selector: 'app-post-ride',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
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
    MatRippleModule
  ],
  templateUrl: './post-ride.component.html',
  styleUrls: ['./post-ride.component.scss']
})
export class PostRideComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('postRideMap') mapContainerRef!: ElementRef;

  rideForm!: FormGroup;
  loading = false;
  minDate = new Date();
  routeLoading = false;
  selectionMode: 'origin' | 'dest' = 'origin';

  // Origin
  originLat?: number;
  originLng?: number;
  originAddress = '';
  originSearchQuery = '';
  originSearchResults: any[] = [];
  showOriginResults = false;
  originSearching = false;
  gettingOriginLocation = false;

  // Destination
  destLat?: number;
  destLng?: number;
  destAddress = '';
  destSearchQuery = '';
  destSearchResults: any[] = [];
  showDestResults = false;
  destSearching = false;

  // Map
  private map: L.Map | null = null;
  private originMarker: L.Marker | null = null;
  private destMarker: L.Marker | null = null;
  private routeLine?: L.Polyline;
  private searchDebounceTimer: any;

  constructor(
    private fb: FormBuilder,
    private rideService: RideService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.initMap(), 200);
  }

  ngOnDestroy(): void {
    if (this.map) this.map.remove();
    if (this.searchDebounceTimer) clearTimeout(this.searchDebounceTimer);
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

  // ── Map ──
  private initMap(): void {
    if (!this.mapContainerRef?.nativeElement) return;

    this.map = L.map(this.mapContainerRef.nativeElement, {
      zoomControl: true,
      attributionControl: false
    }).setView([23.8103, 90.4125], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: ''
    }).addTo(this.map);

    this.addMarkerStyles();

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.handleMapClick(e.latlng);
    });

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => this.map?.setView([pos.coords.latitude, pos.coords.longitude], 14),
        () => {}
      );
    }
  }

  private addMarkerStyles(): void {
    const id = 'post-ride-marker-styles';
    if (document.getElementById(id)) return;
    const s = document.createElement('style');
    s.id = id;
    s.textContent = `
      .pr-marker{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:13px;color:#fff;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.3)}
      .pr-origin{background:#4caf50}
      .pr-dest{background:#ef5350}
    `;
    document.head.appendChild(s);
  }

  private handleMapClick(latlng: L.LatLng): void {
    if (!this.map) return;
    const lat = latlng.lat, lng = latlng.lng;

    if (this.selectionMode === 'origin') {
      this.setOriginMarker(lat, lng);
      this.reverseGeocode(lat, lng, 'origin');
      this.selectionMode = 'dest';
    } else {
      this.setDestMarker(lat, lng);
      this.reverseGeocode(lat, lng, 'dest');
    }
    this.drawRouteIfReady();
  }

  private setOriginMarker(lat: number, lng: number): void {
    if (!this.map) return;
    if (this.originMarker) this.map.removeLayer(this.originMarker);
    const icon = L.divIcon({
      className: 'custom-marker',
      html: '<div class="pr-marker pr-origin">A</div>',
      iconSize: [28, 28], iconAnchor: [14, 14]
    });
    this.originMarker = L.marker([lat, lng], { icon, draggable: true }).addTo(this.map);
    this.originMarker.on('dragend', () => {
      const p = this.originMarker!.getLatLng();
      this.originLat = p.lat; this.originLng = p.lng;
      this.reverseGeocode(p.lat, p.lng, 'origin');
      this.drawRouteIfReady();
    });
    this.originLat = lat; this.originLng = lng;
  }

  private setDestMarker(lat: number, lng: number): void {
    if (!this.map) return;
    if (this.destMarker) this.map.removeLayer(this.destMarker);
    const icon = L.divIcon({
      className: 'custom-marker',
      html: '<div class="pr-marker pr-dest">B</div>',
      iconSize: [28, 28], iconAnchor: [14, 14]
    });
    this.destMarker = L.marker([lat, lng], { icon, draggable: true }).addTo(this.map);
    this.destMarker.on('dragend', () => {
      const p = this.destMarker!.getLatLng();
      this.destLat = p.lat; this.destLng = p.lng;
      this.reverseGeocode(p.lat, p.lng, 'dest');
      this.drawRouteIfReady();
    });
    this.destLat = lat; this.destLng = lng;
  }

  private drawRouteIfReady(): void {
    if (!this.map || !this.originLat || !this.originLng || !this.destLat || !this.destLng) return;
    this.routeLoading = true;
    if (this.routeLine) this.map.removeLayer(this.routeLine);
    const url = `https://router.project-osrm.org/route/v1/driving/${this.originLng},${this.originLat};${this.destLng},${this.destLat}?overview=full&geometries=geojson`;
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), 5000);
    fetch(url, { signal: ctrl.signal })
      .then(r => { clearTimeout(tid); return r.json(); })
      .then(data => {
        this.routeLoading = false;
        if (data.code === 'Ok' && data.routes?.[0]) {
          const coords: L.LatLngExpression[] = data.routes[0].geometry.coordinates.map((c: number[]) => [c[1], c[0]]);
          this.routeLine = L.polyline(coords, { color: '#1976d2', weight: 5, opacity: 0.8 }).addTo(this.map!);
          this.map!.fitBounds(this.routeLine.getBounds(), { padding: [50, 50] });
        } else {
          this.drawFallbackRoute();
        }
      })
      .catch(() => { clearTimeout(tid); this.routeLoading = false; this.drawFallbackRoute(); });
  }

  private drawFallbackRoute(): void {
    if (!this.map || !this.originLat || !this.destLat) return;
    this.routeLine = L.polyline(
      [[this.originLat, this.originLng!], [this.destLat, this.destLng!]],
      { color: '#1976d2', weight: 4, opacity: 0.6, dashArray: '10, 10' }
    ).addTo(this.map);
    this.map.fitBounds(this.routeLine.getBounds(), { padding: [50, 50] });
  }

  // ── Search ──
  onSearchInput(type: 'origin' | 'dest'): void {
    if (type === 'origin') this.showOriginResults = true; else this.showDestResults = true;
    const q = type === 'origin' ? this.originSearchQuery : this.destSearchQuery;
    this.searchLocation(q, type);
  }

  private searchLocation(query: string, type: 'origin' | 'dest'): void {
    if (this.searchDebounceTimer) clearTimeout(this.searchDebounceTimer);
    if (!query || query.length < 2) {
      if (type === 'origin') { this.originSearchResults = []; this.originSearching = false; }
      else { this.destSearchResults = []; this.destSearching = false; }
      return;
    }
    if (type === 'origin') this.originSearching = true; else this.destSearching = true;
    this.searchDebounceTimer = setTimeout(() => {
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=bd`,
        { headers: { 'Accept': 'application/json' } })
        .then(r => r.json())
        .then(results => {
          if (type === 'origin') { this.originSearchResults = results; this.originSearching = false; }
          else { this.destSearchResults = results; this.destSearching = false; }
        })
        .catch(() => {
          if (type === 'origin') { this.originSearchResults = []; this.originSearching = false; }
          else { this.destSearchResults = []; this.destSearching = false; }
        });
    }, 400);
  }

  selectSearchResult(result: any, type: 'origin' | 'dest', event: Event): void {
    event.preventDefault();
    const lat = parseFloat(result.lat), lng = parseFloat(result.lon);
    const short = this.getShortDisplayName(result.display_name);
    if (type === 'origin') {
      this.originAddress = result.display_name;
      this.originSearchQuery = short;
      this.showOriginResults = false; this.originSearchResults = [];
      this.setOriginMarker(lat, lng);
      this.rideForm.patchValue({ origin: result.display_name });
      this.selectionMode = 'dest';
    } else {
      this.destAddress = result.display_name;
      this.destSearchQuery = short;
      this.showDestResults = false; this.destSearchResults = [];
      this.setDestMarker(lat, lng);
      this.rideForm.patchValue({ destination: result.display_name });
    }
    this.map?.panTo([lat, lng]);
    this.drawRouteIfReady();
  }

  onSearchFocus(type: 'origin' | 'dest'): void {
    if (type === 'origin' && this.originSearchResults.length > 0) this.showOriginResults = true;
    else if (type === 'dest' && this.destSearchResults.length > 0) this.showDestResults = true;
  }

  onSearchBlur(type: 'origin' | 'dest'): void {
    setTimeout(() => {
      if (type === 'origin') this.showOriginResults = false;
      else this.showDestResults = false;
    }, 200);
  }

  clearSearch(type: 'origin' | 'dest', event: Event): void {
    event.stopPropagation();
    if (type === 'origin') {
      this.originSearchQuery = ''; this.originSearchResults = []; this.showOriginResults = false;
      if (this.originMarker && this.map) this.map.removeLayer(this.originMarker);
      this.originMarker = null; this.originLat = undefined; this.originLng = undefined;
      this.originAddress = ''; this.selectionMode = 'origin';
    } else {
      this.destSearchQuery = ''; this.destSearchResults = []; this.showDestResults = false;
      if (this.destMarker && this.map) this.map.removeLayer(this.destMarker);
      this.destMarker = null; this.destLat = undefined; this.destLng = undefined;
      this.destAddress = '';
    }
    if (this.routeLine && this.map) { this.map.removeLayer(this.routeLine); this.routeLine = undefined; }
  }

  useCurrentLocation(type: 'origin' | 'dest'): void {
    if (!navigator.geolocation) { this.snackBar.open('Geolocation not supported', 'OK', { duration: 3000 }); return; }
    this.gettingOriginLocation = true;
    navigator.geolocation.getCurrentPosition(
      pos => this.reverseGeocode(pos.coords.latitude, pos.coords.longitude, type),
      () => {
        this.gettingOriginLocation = false;
        this.snackBar.open('Unable to get location', 'OK', { duration: 3000 });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  private reverseGeocode(lat: number, lng: number, type: 'origin' | 'dest'): void {
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18`,
      { headers: { 'Accept': 'application/json' } })
      .then(r => r.json())
      .then(result => {
        const addr = result.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        const short = this.getShortDisplayName(addr);
        if (type === 'origin') {
          this.originAddress = addr; this.originSearchQuery = short;
          this.gettingOriginLocation = false;
          this.setOriginMarker(lat, lng);
          this.rideForm.patchValue({ origin: addr });
          this.selectionMode = 'dest';
        } else {
          this.destAddress = addr; this.destSearchQuery = short;
          this.setDestMarker(lat, lng);
          this.rideForm.patchValue({ destination: addr });
        }
        this.drawRouteIfReady();
      })
      .catch(() => {
        const fallback = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        if (type === 'origin') {
          this.originAddress = fallback; this.originSearchQuery = fallback;
          this.gettingOriginLocation = false;
          this.setOriginMarker(lat, lng);
          this.rideForm.patchValue({ origin: fallback });
          this.selectionMode = 'dest';
        } else {
          this.destAddress = fallback; this.destSearchQuery = fallback;
          this.setDestMarker(lat, lng);
          this.rideForm.patchValue({ destination: fallback });
        }
        this.drawRouteIfReady();
      });
  }

  getShortDisplayName(name: string): string {
    if (!name) return '';
    return name.split(',').slice(0, 2).join(', ').trim();
  }

  // ── Submit ──
  onSubmit(): void {
    if (this.rideForm.invalid || !this.originLat || !this.destLat || this.loading) return;
    this.loading = true;

    const f = this.rideForm.value;
    const dep = new Date(f.departureDate);
    const [h, m] = f.departureTime.split(':');
    dep.setHours(parseInt(h), parseInt(m), 0, 0);

    const request: CreateRideRequest = {
      origin: this.originAddress || this.rideForm.value.origin || '',
      destination: this.destAddress || this.rideForm.value.destination || '',
      originLat: this.originLat,
      originLng: this.originLng,
      destLat: this.destLat,
      destLng: this.destLng,
      departureTime: dep.toISOString(),
      helmetProvided: f.helmetProvided,
      notes: f.notes || undefined
    };

    this.rideService.createRide(request).subscribe({
      next: () => {
        this.loading = false;
        this.snackBar.open('Ride posted successfully!', 'Close', { duration: 3000 });
        this.router.navigate(['/rider/my-rides']);
      },
      error: (err) => {
        this.loading = false;
        this.snackBar.open(err.error?.message || 'Failed to post ride. Make sure your license is verified.', 'Close', { duration: 5000 });
      }
    });
  }
}
