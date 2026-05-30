import { jwtVerify } from "jose";
import type { UserRole } from "@prisma/client";
import type { JwtPayload } from "./index";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-in-production";

function secretKey() {
  return new TextEncoder().encode(JWT_SECRET);
}

/** Edge/middleware-safe JWT verification (jsonwebtoken is Node-only). */
export async function verifyTokenEdge(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (
      typeof payload.sub !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.role !== "string" ||
      typeof payload.verified !== "boolean"
    ) {
      return null;
    }
    return {
      sub: payload.sub,
      email: payload.email,
      role: payload.role as UserRole,
      verified: payload.verified,
    };
  } catch {
    return null;
  }
}
