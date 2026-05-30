/** OAuth flow stub — real connectors implement provider-specific redirects externally. */

export interface OAuthConfig {
  clientId: string;
  authorizationUrl: string;
  tokenUrl: string;
  scopes: string[];
  redirectUri: string;
}

export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
}

export function buildAuthorizationUrl(config: OAuthConfig, state: string): string {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: config.scopes.join(" "),
    state,
  });
  return `${config.authorizationUrl}?${params.toString()}`;
}

/** Stub token exchange — returns mock tokens in development */
export async function exchangeAuthorizationCode(
  _config: OAuthConfig,
  _code: string
): Promise<OAuthTokens> {
  if (process.env.NODE_ENV === "production") {
    throw new Error("OAuth token exchange not configured for this connector");
  }
  return {
    accessToken: `mock_access_${Date.now()}`,
    refreshToken: `mock_refresh_${Date.now()}`,
    expiresAt: new Date(Date.now() + 3600_000),
  };
}

export async function refreshAccessToken(
  _config: OAuthConfig,
  _refreshToken: string
): Promise<OAuthTokens> {
  return exchangeAuthorizationCode(_config, "refresh-stub");
}
