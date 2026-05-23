import { NextRequest } from 'next/server';
import crypto from 'crypto';

const PROVIDER_COOKIE = 'wfd_provider_cfg';

export interface ProviderConfig {
  provider: 'openai' | 'anthropic' | 'deepseek' | 'mock';
  apiKey: string;
}

// Dynamic AES-256-GCM Key derivation (32-byte key)
function getEncryptionKey(): Buffer {
  if (process.env.NODE_ENV === 'production' && !process.env.COOKIE_ENCRYPTION_SECRET) {
    throw new Error('FATAL: COOKIE_ENCRYPTION_SECRET is required in production mode!');
  }
  return crypto
    .createHash('sha256')
    .update(process.env.COOKIE_ENCRYPTION_SECRET || 'wfd-cookie-encryption-fallback-key-2026-secure')
    .digest();
}

/**
 * Encrypt a plaintext string using AES-256-GCM
 */
export function encrypt(text: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12); // 12-byte IV for dynamic entropy
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${encrypted}:${authTag}`;
}

/**
 * Decrypt a ciphertext string using AES-256-GCM
 */
export function decrypt(encryptedText: string): string {
  const key = getEncryptionKey();
  const parts = encryptedText.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted session cookie format');
  }
  const iv = Buffer.from(parts[0], 'hex');
  const ciphertext = parts[1];
  const authTag = Buffer.from(parts[2], 'hex');
  
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * Reads the provider + API key from the HttpOnly cookie set by /api/set-provider.
 * Call this at the top of every API route handler instead of reading from req.json().
 *
 * Falls back to environment variables so the app still works in server-only deployments
 * where no cookie has been set (e.g., when OPENAI_API_KEY is in .env.local).
 */
export function getProviderConfig(req: NextRequest): ProviderConfig {
  const raw = req.cookies.get(PROVIDER_COOKIE)?.value;

  if (raw) {
    try {
      const decrypted = decrypt(raw);
      const parsed = JSON.parse(decrypted) as ProviderConfig;
      if (parsed.provider && parsed.apiKey) {
        return parsed;
      }
    } catch {
      // Fall through to env vars
    }
  }

  // Env-var fallback (useful for self-hosted / CI deployments)
  if (process.env.OPENAI_API_KEY) {
    return { provider: 'openai', apiKey: process.env.OPENAI_API_KEY };
  }
  if (process.env.ANTHROPIC_API_KEY) {
    return { provider: 'anthropic', apiKey: process.env.ANTHROPIC_API_KEY };
  }
  if (process.env.DEEPSEEK_API_KEY) {
    return { provider: 'deepseek', apiKey: process.env.DEEPSEEK_API_KEY };
  }

  // Fallback to high-fidelity mock simulation mode
  return { provider: 'mock', apiKey: 'mock-key-for-simulation-mode' };
}
