/**
 * HealthSync AI / Cura+ - Cryptographic Data Privacy & Encryption Helper
 * Provides AES-256-GCM encryption and decryption for sensitive medical records & PII
 */

const crypto = require('crypto');
const config = require('../config/env');

// Derive 32-byte encryption key from JWT secret or environment
const ENCRYPTION_KEY = crypto
  .createHash('sha256')
  .update(config.jwt.secret || 'cura-plus-fallback-health-secret-key-2026')
  .digest();

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

class CryptoHelper {
  /**
   * Encrypt sensitive text or objects into a secure hex string (IV + Tag + Ciphertext)
   * @param {string|object} data - Data to encrypt
   * @returns {string} Encrypted string in format `iv:authTag:encryptedContent`
   */
  static encrypt(data) {
    if (data === null || data === undefined) return null;

    try {
      const text = typeof data === 'object' ? JSON.stringify(data) : String(data);
      const iv = crypto.randomBytes(IV_LENGTH);
      const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);

      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const authTag = cipher.getAuthTag();

      return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    } catch (err) {
      console.error('Data encryption failed:', err.message);
      return typeof data === 'object' ? JSON.stringify(data) : String(data);
    }
  }

  /**
   * Decrypt ciphertext back to original string or parsed object
   * @param {string} cipherText - Encrypted string in format `iv:authTag:encryptedContent`
   * @param {boolean} parseJson - Whether to parse output as JSON
   * @returns {string|object} Decrypted plain text or parsed JSON
   */
  static decrypt(cipherText, parseJson = false) {
    if (!cipherText || typeof cipherText !== 'string' || !cipherText.includes(':')) {
      return cipherText;
    }

    try {
      const parts = cipherText.split(':');
      if (parts.length !== 3) return cipherText;

      const [ivHex, authTagHex, encryptedHex] = parts;
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');

      const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      if (parseJson) {
        try {
          return JSON.parse(decrypted);
        } catch {
          return decrypted;
        }
      }

      return decrypted;
    } catch (err) {
      // In case of unencrypted legacy data or key mismatch, return original text safely
      return cipherText;
    }
  }

  /**
   * Mask sensitive string (e.g., email or medical record ID)
   */
  static mask(str, visibleStart = 2, visibleEnd = 2) {
    if (!str || str.length <= visibleStart + visibleEnd) return str;
    const start = str.slice(0, visibleStart);
    const end = str.slice(-visibleEnd);
    return `${start}${'*'.repeat(str.length - visibleStart - visibleEnd)}${end}`;
  }
}

module.exports = CryptoHelper;
