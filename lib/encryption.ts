import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;

/**
 * Get encryption key from environment
 * Generate with: openssl rand -hex 32
 */
function getEncryptionKey(): Buffer {
     const key = process.env.ENCRYPTION_KEY;
     if (!key) {
          throw new Error('ENCRYPTION_KEY environment variable is not set');
     }
     return Buffer.from(key, 'hex');
}

/**
 * Encrypt sensitive data (like OAuth tokens)
 */
export async function encryptToken(token: string): Promise<string> {
     const key = getEncryptionKey();
     const iv = crypto.randomBytes(16);

     const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
     let encrypted = cipher.update(token, 'utf8', 'hex');
     encrypted += cipher.final('hex');

     const authTag = cipher.getAuthTag();

     // Format: iv:authTag:encryptedData
     return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt sensitive data
 */
export async function decryptToken(encryptedToken: string): Promise<string> {
     const key = getEncryptionKey();
     const parts = encryptedToken.split(':');

     if (parts.length !== 3) {
          throw new Error('Invalid encrypted token format');
     }

     const [ivHex, authTagHex, encryptedData] = parts;
     const iv = Buffer.from(ivHex, 'hex');
     const authTag = Buffer.from(authTagHex, 'hex');

     const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
     decipher.setAuthTag(authTag);

     let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
     decrypted += decipher.final('utf8');

     return decrypted;
}

/**
 * Generate a secure random secret for webhooks
 */
export function generateWebhookSecret(): string {
     return crypto.randomBytes(32).toString('hex');
}

/**
 * Verify webhook signature using HMAC SHA256
 */
export function verifyWebhookSignature(
     payload: string,
     signature: string | null,
     secret: string,
     timestamp?: string | null
): boolean {
     if (!signature) return false;

     const data = timestamp ? `${timestamp}.${payload}` : payload;

     const expectedSignature = crypto
          .createHmac('sha256', secret)
          .update(data)
          .digest('hex');

     // Timing-safe comparison
     return crypto.timingSafeEqual(
          Buffer.from(signature),
          Buffer.from(expectedSignature)
     );
}
