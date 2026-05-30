import type { Prisma } from "@prisma/client";

export function asInputJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}
