import { scryptSync, randomBytes, timingSafeEqual } from 'crypto';
import bcrypt from 'bcryptjs';

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  if (!password || !stored) return false;

  if (stored.startsWith('$2')) {
    try {
      return bcrypt.compareSync(password, stored);
    } catch {
      return false;
    }
  }

  const parts = stored.split(':');
  if (parts.length !== 2) return false;
  const [salt, hash] = parts;
  try {
    const verify = scryptSync(password, salt, 64).toString('hex');
    return timingSafeEqual(Buffer.from(hash), Buffer.from(verify));
  } catch {
    return false;
  }
}
