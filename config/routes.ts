/** Routes that require authentication (middleware + nav guards). */
export const protectedRoutes = [
  "/dashboard",
  "/feed",
  "/alerts",
  "/events",
  "/marketplace",
  "/admin",
  "/assistant",
  "/map",
  "/profile",
  "/report",
  "/hoa",
  "/services",
  "/search",
  "/businesses",
  "/messages",
  "/settings",
  "/discover",
  "/groups",
  "/onboarding",
] as const;

/** Routes restricted to admin/moderator roles. */
export const adminRoutes = ["/admin", "/admin/ops"] as const;

/** Routes restricted to ADMIN / SUPER_ADMIN (privileges, monitoring, settings hub). */
export const adminSettingsRoutes = [
  "/admin/settings",
  "/admin/monitoring",
] as const;

/** Public Safety ops console — separate from platform admin settings. */
export const adminOpsRoutes = ["/admin/ops"] as const;

export const authRoutes = ["/login", "/register"] as const;

export type ProtectedRoute = (typeof protectedRoutes)[number];
