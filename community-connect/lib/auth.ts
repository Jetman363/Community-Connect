import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import type { UserRole } from "@prisma/client";
import type { AuthUser } from "@/types";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-in-production";
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || "7d";

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  verified: boolean;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES as jwt.SignOptions["expiresIn"] });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

export function toAuthUser(payload: JwtPayload, displayName?: string): AuthUser {
  return {
    id: payload.sub,
    email: payload.email,
    role: payload.role,
    verified: payload.verified,
    displayName,
  };
}

export const AUTH_COOKIE = "cc_token";
