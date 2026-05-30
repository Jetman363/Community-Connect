import { createCipheriv, createDecipheriv, createHash, randomBytes, scryptSync } from "crypto";
import { prisma } from "@/lib/prisma";
import type { CredentialType } from "@prisma/client";

const ALGO = "aes-256-gcm";

function deriveKey(): Buffer {
  const secret = process.env.INTEGRATION_ENCRYPTION_KEY ?? "dev-only-change-in-production";
  return scryptSync(secret, "cc-integration-salt", 32);
}

function encrypt(plaintext: string): string {
  const key = deriveKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString("hex"), tag.toString("hex"), enc.toString("hex")].join(":");
}

function decrypt(payload: string): string {
  const [ivHex, tagHex, dataHex] = payload.split(":");
  const key = deriveKey();
  const decipher = createDecipheriv(ALGO, key, Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  return Buffer.concat([
    decipher.update(Buffer.from(dataHex, "hex")),
    decipher.final(),
  ]).toString("utf8");
}

export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export function hashWebhookSecret(secret: string): string {
  return createHash("sha256").update(secret).digest("hex");
}

export function verifyWebhookSignature(
  secret: string,
  body: string,
  signature: string | null
): boolean {
  if (!signature) return false;
  const expected = createHash("sha256").update(`${secret}:${body}`).digest("hex");
  return expected === signature || signature === `sha256=${expected}`;
}

export function keyHint(value: string): string {
  if (value.length <= 4) return "****";
  return `…${value.slice(-4)}`;
}

/** Never log return value of decryptCredential */
export async function storeCredential(
  connectorId: string,
  type: CredentialType,
  plaintext: Record<string, string>
): Promise<{ hint: string }> {
  const serialized = JSON.stringify(plaintext);
  const encryptedPayload = encrypt(serialized);
  const hint =
    plaintext.apiKey != null
      ? keyHint(plaintext.apiKey)
      : plaintext.clientId != null
        ? keyHint(plaintext.clientId)
        : "stored";

  const existing = await prisma.integrationCredential.findFirst({
    where: { connectorId, type },
  });

  if (existing) {
    await prisma.integrationCredential.update({
      where: { id: existing.id },
      data: { encryptedPayload, keyHint: hint, rotatedAt: new Date() },
    });
  } else {
    await prisma.integrationCredential.create({
      data: { connectorId, type, encryptedPayload, keyHint: hint },
    });
  }

  return { hint };
}

export async function decryptCredential(
  connectorId: string,
  type: CredentialType = "API_KEY"
): Promise<Record<string, string> | null> {
  const row = await prisma.integrationCredential.findFirst({
    where: { connectorId, type },
  });
  if (!row) return null;
  try {
    return JSON.parse(decrypt(row.encryptedPayload)) as Record<string, string>;
  } catch {
    return null;
  }
}
