export class DbTimeoutError extends Error {
  constructor(message = "Database connection timeout") {
    super(message);
    this.name = "DbTimeoutError";
  }
}

/** Race a Prisma query against a timeout so unreachable DB fails fast. */
export async function withDbTimeout<T>(promise: Promise<T>, ms = 5000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new DbTimeoutError()), ms);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
