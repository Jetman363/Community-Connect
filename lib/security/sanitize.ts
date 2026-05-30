/** Strip HTML tags and normalize whitespace for user-generated text. */
export function sanitizeText(input: string, maxLength = 10_000): string {
  return input
    .replace(/<[^>]*>/g, "")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "")
    .trim()
    .slice(0, maxLength);
}

/** Allow alphanumeric, dash, underscore for slugs/ids. */
export function sanitizeSlug(input: string): string {
  return input.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 128);
}

/** Basic email normalization. */
export function sanitizeEmail(input: string): string {
  return input.trim().toLowerCase().slice(0, 320);
}
