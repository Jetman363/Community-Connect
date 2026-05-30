export interface SecurityHeaderOptions {
  nonce?: string;
}

export function buildSecurityHeaders(opts: SecurityHeaderOptions = {}): Record<string, string> {
  const nonce = opts.nonce ?? "";
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${nonce ? ` 'nonce-${nonce}'` : ""} https://maps.googleapis.com`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https: wss:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");

  const headers: Record<string, string> = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(self)",
    "Content-Security-Policy": csp,
    "X-DNS-Prefetch-Control": "on",
  };

  if (process.env.NODE_ENV === "production" || process.env.APP_ENV === "production") {
    headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload";
  }

  return headers;
}

export function applySecurityHeaders(
  response: Response,
  opts?: SecurityHeaderOptions
): Response {
  const headers = buildSecurityHeaders(opts);
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }
  return response;
}
