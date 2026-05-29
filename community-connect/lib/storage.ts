import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

/** Local/S3-ready upload abstraction */
export interface StoredFile {
  url: string;
  key: string;
}

export async function storeUpload(buffer: Buffer, filename: string): Promise<StoredFile> {
  const provider = process.env.STORAGE_PROVIDER || "local";

  if (provider === "s3" && process.env.AWS_S3_BUCKET) {
    // S3 stub — wire @aws-sdk/client-s3 in production
    const key = `uploads/${uuidv4()}-${filename}`;
    return {
      key,
      url: `https://${process.env.AWS_S3_BUCKET}.s3.amazonaws.com/${key}`,
    };
  }

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });
  const safeName = `${uuidv4()}-${filename.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
  const filePath = path.join(uploadsDir, safeName);
  await writeFile(filePath, buffer);
  return {
    key: safeName,
    url: `/uploads/${safeName}`,
  };
}

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "application/pdf",
];
const MAX_SIZE = 10 * 1024 * 1024;

export function validateUpload(mimeType: string, size: number): string | null {
  if (!ALLOWED_TYPES.includes(mimeType)) return "Invalid file type";
  if (size > MAX_SIZE) return "File too large (max 10MB)";
  return null;
}
