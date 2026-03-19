export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  profilePhotoUrl?: string;
  role: 'Passenger' | 'Rider' | 'Admin';
  isActive: boolean;
  themePreference?: 'light' | 'dark';
  emergencyContact?: EmergencyContact;
  createdAt: string;
}

export interface EmergencyContact {
  name?: string;
  phone?: string;
  relation?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  role: 'Passenger' | 'Rider';
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface UpdateProfileRequest {
  fullName?: string;
  phone?: string;
  profilePhotoUrl?: string;
}

export interface UpdateEmergencyContactRequest {
  name?: string;
  phone?: string;
  relation?: string;
}
