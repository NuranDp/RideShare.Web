export interface RiderProfile {
  id: string;
  userId: string;
  licenseNumber?: string;
  licenseImageUrl?: string;
  licenseExpiryDate?: string;
  isLicenseVerified: boolean;
  verifiedAt?: string;
  motorcycleModel?: string;
  plateNumber?: string;
  totalRides: number;
  totalRatings: number;
  averageRating: number;
  createdAt: string;
}

export interface SubmitLicenseRequest {
  licenseNumber: string;
  licenseImageUrl: string;
  licenseExpiryDate: string;
}

export interface UpdateRiderProfileRequest {
  motorcycleModel?: string;
  plateNumber?: string;
}

export interface PublicRiderProfile {
  userId: string;
  fullName: string;
  profilePhotoUrl?: string;
  isLicenseVerified: boolean;
  motorcycleModel?: string;
  totalRides: number;
  averageRating: number;
  memberSince: string;
}

export interface LicenseVerificationItem {
  id: string;
  userId: string;
  riderName: string;
  riderEmail: string;
  licenseNumber?: string;
  licenseImageUrl?: string;
  licenseExpiryDate?: string;
  motorcycleModel?: string;
  plateNumber?: string;
  submittedAt: string;
}

export interface LicenseVerificationRequest {
  approved: boolean;
  rejectionReason?: string;
}

export interface AdminStats {
  totalUsers: number;
  totalRiders: number;
  totalPassengers: number;
  verifiedRiders: number;
  pendingVerifications: number;
  totalRides: number;
  activeRides: number;
  completedRides: number;
}

export interface AdminUserListItem {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}
