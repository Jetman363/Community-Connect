import "server-only";
import { logger } from "./logger";

let initialized = false;

/** Initialize Sentry when SENTRY_DSN is configured (no-op otherwise). */
export async function initSentry(): Promise<void> {
  if (initialized) return;
  const dsn = process.env.SENTRY_DSN?.trim();
  if (!dsn) return;

  try {
    // Placeholder: install @sentry/nextjs and uncomment in production
    // const Sentry = await import("@sentry/nextjs");
    // Sentry.init({ dsn, environment: process.env.SENTRY_ENVIRONMENT ?? process.env.APP_ENV });
    logger.info("sentry.placeholder", { dsn: dsn.slice(0, 20) + "..." });
    initialized = true;
  } catch (err) {
    logger.warn("sentry.init.failed", {
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

export function captureException(error: unknown, context?: Record<string, unknown>): void {
  logger.error("exception", {
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    ...context,
  });
  // Sentry.captureException(error) when SDK installed
}
