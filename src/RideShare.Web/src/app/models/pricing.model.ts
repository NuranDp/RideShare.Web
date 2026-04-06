export interface PricingSettings {
  baseFare: number;
  perKmRate: number;
  minimumFare: number;
  maximumFare: number;
  currency: string;
  currencySymbol: string;
  isEnabled: boolean;
  platformFeePercent: number;
  updatedAt: string;
}

export interface UpdatePricingSettingsRequest {
  baseFare?: number;
  perKmRate?: number;
  minimumFare?: number;
  maximumFare?: number;
  currency?: string;
  currencySymbol?: string;
  isEnabled?: boolean;
  platformFeePercent?: number;
}

export interface FareCalculationRequest {
  originLat: number;
  originLng: number;
  destLat: number;
  destLng: number;
}

export interface FareCalculationResponse {
  fare: number | null;
  distanceKm: number;
  isEnabled: boolean;
  currency: string;
  currencySymbol: string;
  displayText: string;
}
