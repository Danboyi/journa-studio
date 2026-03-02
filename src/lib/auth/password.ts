import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 64;

export function hashSecret(secret: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(secret, salt, KEY_LENGTH).toString("hex");
  return `${salt}:${hash}`;
}

export function verifySecret(secret: string, storedHash: string) {
  const [salt, hash] = storedHash.split(":");

  if (!salt || !hash) {
    return false;
  }

  const derived = scryptSync(secret, salt, KEY_LENGTH);
  const provided = Buffer.from(hash, "hex");

  if (provided.length !== derived.length) {
    return false;
  }

  return timingSafeEqual(provided, derived);
}
