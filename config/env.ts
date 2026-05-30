import { z } from "zod";

const serverSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().optional(),
  JWT_SECRET: z.string().min(16).optional(),
  JWT_EXPIRES_IN: z.string().default("7d"),
  SESSION_MAX_AGE_SECONDS: z.coerce.number().int().positive().default(604_800),
  REDIS_URL: z.string().url().optional().or(z.literal("")),
  SENTRY_DSN: z.string().url().optional().or(z.literal("")),
  SENTRY_ENVIRONMENT: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().email().optional(),
  EMAIL_PROVIDER: z.enum(["smtp", "resend", "console"]).default("console"),
  RESEND_API_KEY: z.string().optional(),
  STORAGE_PROVIDER: z.enum(["local", "s3"]).default("local"),
  AWS_S3_BUCKET: z.string().optional(),
  AWS_REGION: z.string().default("us-east-1"),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default("gpt-4o-mini"),
  APP_ENV: z.enum(["development", "staging", "production"]).default("development"),
  ENABLE_METRICS: z
    .string()
    .optional()
    .transform((v) => v === "true" || v === "1"),
  RATE_LIMIT_ENABLED: z
    .string()
    .optional()
    .transform((v) => v !== "false" && v !== "0"),
});

const clientSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: z.string().optional(),
  NEXT_PUBLIC_SOCKET_URL: z.string().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
  NEXT_PUBLIC_APP_ENV: z.enum(["development", "staging", "production"]).default("development"),
});

export type ServerEnv = z.infer<typeof serverSchema>;
export type ClientEnv = z.infer<typeof clientSchema>;

function parseEnv<T extends z.ZodTypeAny>(schema: T, source: Record<string, string | undefined>) {
  const result = schema.safeParse(source);
  if (!result.success) {
    const msg = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    if (process.env.NODE_ENV === "production") {
      throw new Error(`Invalid environment: ${msg}`);
    }
    console.warn("[env] validation warnings:", msg);
    return schema.parse({});
  }
  return result.data;
}

/** Server-only validated environment (never import from client components). */
export function getServerEnv(): ServerEnv {
  return parseEnv(serverSchema, process.env);
}

/** Client-safe public environment variables. */
export function getClientEnv(): ClientEnv {
  return parseEnv(clientSchema, {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV ?? process.env.APP_ENV,
  });
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === "production" || process.env.APP_ENV === "production";
}

export function isStaging(): boolean {
  return process.env.APP_ENV === "staging";
}

export function hasRedis(): boolean {
  return Boolean(process.env.REDIS_URL?.trim());
}
