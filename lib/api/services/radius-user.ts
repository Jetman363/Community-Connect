import { prisma } from "@/lib/prisma";
import { DEMO_LOCATION } from "@/config/interests";
import type {
  UserProfileDto,
  UserLocationDto,
  UserPreferencesDto,
  SavedLocationDto,
  PrivacySettingsDto,
} from "@/types/radius";
import type { LocationSource, BehaviorEventType } from "@prisma/client";
import { Prisma } from "@prisma/client";

const DEFAULT_PREFS: UserPreferencesDto = {
  notificationsEnabled: true,
  emailDigest: true,
  pushAlerts: true,
  emergencyAlerts: true,
  profileVisibility: "community",
  searchVisibility: "community",
  activityVisibility: "community",
  communityVisibility: "community",
  radiusMiles: 10,
  menuLocked: false,
  navOrder: null,
};

export async function getUserProfile(userId: string): Promise<UserProfileDto & { source: "db" | "mock" }> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        personalizationProfile: { select: { onboardingCompletedAt: true } },
      },
    });
    if (!user?.profile) {
      return {
        id: userId,
        email: "user@example.com",
        displayName: "Neighbor",
        source: "mock",
      };
    }
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.profile.displayName,
      firstName: user.profile.firstName,
      lastName: user.profile.lastName,
      bio: user.profile.bio,
      avatarUrl: user.profile.avatarUrl,
      neighborhood: user.profile.neighborhood,
      onboardingComplete: Boolean(user.personalizationProfile?.onboardingCompletedAt),
      source: "db",
    };
  } catch {
    return { id: userId, email: "", displayName: "Neighbor", source: "mock" };
  }
}

export async function updateUserProfile(
  userId: string,
  data: {
    displayName?: string;
    firstName?: string;
    lastName?: string;
    bio?: string;
    username?: string;
    avatarUrl?: string;
    neighborhood?: string;
  }
) {
  try {
    if (data.username) {
      await prisma.user.update({
        where: { id: userId },
        data: { username: data.username },
      });
    }
    const displayName =
      data.displayName ??
      (data.firstName && data.lastName ? `${data.firstName} ${data.lastName}` : undefined);
    await prisma.profile.update({
      where: { userId },
      data: {
        ...(displayName ? { displayName } : {}),
        ...(data.firstName !== undefined ? { firstName: data.firstName } : {}),
        ...(data.lastName !== undefined ? { lastName: data.lastName } : {}),
        ...(data.bio !== undefined ? { bio: data.bio } : {}),
        ...(data.avatarUrl !== undefined ? { avatarUrl: data.avatarUrl } : {}),
        ...(data.neighborhood !== undefined ? { neighborhood: data.neighborhood } : {}),
      },
    });
    return getUserProfile(userId);
  } catch {
    return { ...data, source: "mock" as const };
  }
}

export async function getUserLocation(
  userId: string
): Promise<UserLocationDto & { dataSource: "db" | "mock" }> {
  try {
    const loc = await prisma.userLocation.findUnique({ where: { userId } });
    if (!loc) {
      return {
        ...DEMO_LOCATION,
        precise: false,
        sharingEnabled: true,
        source: "MANUAL",
        dataSource: "mock",
      };
    }
    return {
      lat: loc.lat,
      lng: loc.lng,
      city: loc.city,
      state: loc.state,
      zip: loc.zip,
      country: loc.country,
      precise: loc.precise,
      sharingEnabled: loc.sharingEnabled,
      source: loc.source as "GPS" | "MANUAL",
      dataSource: "db",
    };
  } catch {
    return {
      ...DEMO_LOCATION,
      precise: false,
      sharingEnabled: true,
      source: "MANUAL",
      dataSource: "mock",
    };
  }
}

export async function upsertUserLocation(
  userId: string,
  data: Partial<UserLocationDto> & { source?: LocationSource }
) {
  try {
    const loc = await prisma.userLocation.upsert({
      where: { userId },
      update: {
        lat: data.lat,
        lng: data.lng,
        city: data.city,
        state: data.state,
        zip: data.zip,
        country: data.country ?? "US",
        precise: data.precise ?? false,
        sharingEnabled: data.sharingEnabled ?? true,
        source: (data.source as LocationSource) ?? "MANUAL",
      },
      create: {
        userId,
        lat: data.lat,
        lng: data.lng,
        city: data.city,
        state: data.state,
        zip: data.zip,
        country: data.country ?? "US",
        precise: data.precise ?? false,
        sharingEnabled: data.sharingEnabled ?? true,
        source: (data.source as LocationSource) ?? "MANUAL",
      },
    });
    if (data.lat != null && data.lng != null) {
      await prisma.profile.updateMany({
        where: { userId },
        data: { lat: data.lat, lng: data.lng, neighborhood: data.city ?? undefined },
      });
    }
    return {
      lat: loc.lat,
      lng: loc.lng,
      city: loc.city,
      state: loc.state,
      zip: loc.zip,
      country: loc.country,
      precise: loc.precise,
      sharingEnabled: loc.sharingEnabled,
      source: loc.source,
      dataSource: "db" as const,
    };
  } catch {
    return { ...data, dataSource: "mock" as const };
  }
}

export async function getUserPreferences(userId: string): Promise<UserPreferencesDto & { source: "db" | "mock" }> {
  try {
    const prefs = await prisma.userPreferences.findUnique({ where: { userId } });
    if (!prefs) return { ...DEFAULT_PREFS, source: "mock" };
    return {
      notificationsEnabled: prefs.notificationsEnabled,
      emailDigest: prefs.emailDigest,
      pushAlerts: prefs.pushAlerts,
      emergencyAlerts: prefs.emergencyAlerts,
      profileVisibility: prefs.profileVisibility,
      searchVisibility: prefs.searchVisibility,
      activityVisibility: prefs.activityVisibility,
      communityVisibility: prefs.communityVisibility,
      radiusMiles: prefs.radiusMiles,
      menuLocked: prefs.menuLocked,
      navOrder: prefs.navOrder as string[] | null,
      source: "db",
    };
  } catch {
    return { ...DEFAULT_PREFS, source: "mock" };
  }
}

export async function updateUserPreferences(
  userId: string,
  data: Partial<UserPreferencesDto>
) {
  try {
    const prefs = await prisma.userPreferences.upsert({
      where: { userId },
      update: {
        notificationsEnabled: data.notificationsEnabled,
        emailDigest: data.emailDigest,
        pushAlerts: data.pushAlerts,
        emergencyAlerts: data.emergencyAlerts,
        profileVisibility: data.profileVisibility,
        searchVisibility: data.searchVisibility,
        activityVisibility: data.activityVisibility,
        communityVisibility: data.communityVisibility,
        radiusMiles: data.radiusMiles,
        menuLocked: data.menuLocked,
        navOrder:
          data.navOrder === null
            ? Prisma.JsonNull
            : data.navOrder === undefined
              ? undefined
              : data.navOrder,
      },
      create: {
        userId,
        notificationsEnabled: data.notificationsEnabled ?? DEFAULT_PREFS.notificationsEnabled,
        emailDigest: data.emailDigest ?? DEFAULT_PREFS.emailDigest,
        pushAlerts: data.pushAlerts ?? DEFAULT_PREFS.pushAlerts,
        emergencyAlerts: data.emergencyAlerts ?? DEFAULT_PREFS.emergencyAlerts,
        profileVisibility: data.profileVisibility ?? DEFAULT_PREFS.profileVisibility,
        searchVisibility: data.searchVisibility ?? DEFAULT_PREFS.searchVisibility,
        activityVisibility: data.activityVisibility ?? DEFAULT_PREFS.activityVisibility,
        communityVisibility: data.communityVisibility ?? DEFAULT_PREFS.communityVisibility,
        radiusMiles: data.radiusMiles ?? DEFAULT_PREFS.radiusMiles,
        menuLocked: data.menuLocked ?? DEFAULT_PREFS.menuLocked,
        navOrder: data.navOrder ?? undefined,
      },
    });
    return {
      notificationsEnabled: prefs.notificationsEnabled,
      emailDigest: prefs.emailDigest,
      pushAlerts: prefs.pushAlerts,
      emergencyAlerts: prefs.emergencyAlerts,
      profileVisibility: prefs.profileVisibility,
      searchVisibility: prefs.searchVisibility,
      activityVisibility: prefs.activityVisibility,
      communityVisibility: prefs.communityVisibility,
      radiusMiles: prefs.radiusMiles,
      menuLocked: prefs.menuLocked,
      navOrder: prefs.navOrder as string[] | null,
      source: "db" as const,
    };
  } catch {
    return { ...DEFAULT_PREFS, ...data, source: "mock" as const };
  }
}

export async function getSavedLocations(userId: string): Promise<SavedLocationDto[]> {
  try {
    return prisma.savedLocation.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { id: true, label: true, lat: true, lng: true, city: true, state: true, zip: true },
    });
  } catch {
    return [];
  }
}

export async function createSavedLocation(
  userId: string,
  data: Omit<SavedLocationDto, "id">
) {
  try {
    return prisma.savedLocation.create({
      data: { userId, ...data },
    });
  } catch {
    return { id: "mock", ...data };
  }
}

export async function trackBehavior(
  userId: string,
  event: {
    eventType: BehaviorEventType;
    entityType: string;
    entityId?: string;
    metadata?: Record<string, unknown>;
  }
) {
  try {
    await prisma.userBehavior.create({
      data: {
        userId,
        eventType: event.eventType,
        entityType: event.entityType,
        entityId: event.entityId,
        metadata: (event.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });
    return { ok: true, source: "db" as const };
  } catch {
    return { ok: true, source: "mock" as const };
  }
}

export async function getPrivacySettings(userId: string): Promise<PrivacySettingsDto> {
  const [loc, prefs] = await Promise.all([
    getUserLocation(userId),
    getUserPreferences(userId),
  ]);
  return {
    locationSharingEnabled: loc.sharingEnabled,
    preciseLocation: loc.precise,
    profileVisibility: prefs.profileVisibility,
    searchVisibility: prefs.searchVisibility,
    activityVisibility: prefs.activityVisibility,
    communityVisibility: prefs.communityVisibility,
  };
}

export async function completeOnboarding(userId: string) {
  try {
    await prisma.personalizationProfile.upsert({
      where: { userId },
      update: { onboardingCompletedAt: new Date() },
      create: { userId, interests: [], preferences: {}, onboardingCompletedAt: new Date() },
    });
    return { ok: true };
  } catch {
    return { ok: true };
  }
}

export async function exportUserDataStub(userId: string) {
  const [profile, location, prefs, interests, behaviors] = await Promise.all([
    getUserProfile(userId),
    getUserLocation(userId),
    getUserPreferences(userId),
    prisma.userInterest.findMany({ where: { userId } }).catch(() => []),
    prisma.userBehavior.findMany({ where: { userId }, take: 500, orderBy: { createdAt: "desc" } }).catch(() => []),
  ]);
  return {
    exportedAt: new Date().toISOString(),
    profile,
    location,
    preferences: prefs,
    interests: interests.map((i) => i.topic),
    behaviors: behaviors.map((b) => ({
      eventType: b.eventType,
      entityType: b.entityType,
      entityId: b.entityId,
      createdAt: b.createdAt,
    })),
    note: "Radius GDPR export stub — full export in production.",
  };
}

export async function deleteAccountStub(userId: string, confirmEmail: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } }).catch(() => null);
  if (!user || user.email !== confirmEmail) {
    return { ok: false, error: "Email confirmation does not match" };
  }
  return {
    ok: true,
    status: "scheduled",
    message: "Account deletion scheduled (30-day grace period). Stub — not executed in demo.",
    userId,
  };
}
