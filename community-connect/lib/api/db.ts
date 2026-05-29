import { DbTimeoutError, withDbTimeout } from "@/lib/db/timeout";

export { withDbTimeout, DbTimeoutError };

export function isDbUnavailable(err: unknown): boolean {
  return err instanceof DbTimeoutError || (err instanceof Error && err.message.includes("connect"));
}
