/**
 * CSRF protection notes for Community Connect
 *
 * - Session tokens are stored in httpOnly cookies with SameSite=Lax (see lib/api/auth.ts).
 * - Lax cookies are not sent on cross-site POST requests, mitigating classic CSRF.
 * - State-changing API routes require authentication via cookie or Bearer token.
 * - For additional protection in production:
 *   1. Require custom header (e.g. X-Requested-With) on mutating requests from the SPA.
 *   2. Use double-submit cookie pattern for OAuth callbacks.
 *   3. Validate Origin/Referer headers on sensitive endpoints.
 */

export const CSRF_HEADER = "x-requested-with";

export function isSameOriginRequest(origin: string | null, host: string): boolean {
  if (!origin) return true;
  try {
    const url = new URL(origin);
    return url.host === host;
  } catch {
    return false;
  }
}
