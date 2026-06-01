export interface UserProfileDto {
  id: string;
  email: string;
  username?: string | null;
  displayName: string;
  firstName?: string | null;
  lastName?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  neighborhood?: string | null;
  onboardingComplete?: boolean;
}

export interface UserLocationDto {
  lat?: number | null;
  lng?: number | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  country?: string | null;
  precise: boolean;
  sharingEnabled: boolean;
  source: "GPS" | "MANUAL";
}

export interface UserPreferencesDto {
  notificationsEnabled: boolean;
  emailDigest: boolean;
  pushAlerts: boolean;
  emergencyAlerts: boolean;
  profileVisibility: string;
  searchVisibility: string;
  activityVisibility: string;
  communityVisibility: string;
  radiusMiles: number;
  menuLocked: boolean;
  navOrder?: string[] | null;
}

export interface SavedLocationDto {
  id: string;
  label: string;
  lat: number;
  lng: number;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
}

export interface BehaviorEventInput {
  eventType: "VIEW" | "CLICK" | "SEARCH" | "SAVE" | "SHARE" | "NAVIGATE";
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}

export interface ForYouRecommendation {
  id: string;
  entityType: string;
  entityId: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  href?: string;
  score: number;
  reason: string;
  distanceMiles?: number;
}

export interface GeoLocatable {
  lat?: number | null;
  lng?: number | null;
  id?: string;
}

export interface PrivacySettingsDto {
  locationSharingEnabled: boolean;
  profileVisibility: string;
  searchVisibility: string;
  activityVisibility: string;
  communityVisibility: string;
  preciseLocation: boolean;
}
