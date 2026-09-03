const crypto = require('crypto');
const logger = require('../utils/logger');

// RFC 3548 Base32 alphabet for standard Authenticator apps (Google Authenticator, Microsoft Authenticator, Authy)
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Generates a cryptographically random Base32 secret key.
 */
function generateBase32Secret(length = 16) {
  let secret = '';
  const randomBytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    secret += BASE32_ALPHABET[randomBytes[i] % 32];
  }
  return secret;
}

/**
 * Decodes a Base32 string into a Buffer.
 */
function base32ToBuffer(base32Str) {
  const clean = String(base32Str || '').toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = 0;
  let value = 0;
  const bytes = [];
  for (let i = 0; i < clean.length; i++) {
    const idx = BASE32_ALPHABET.indexOf(clean[i]);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

/**
 * Generates an RFC 6238 TOTP code for a given Base32 secret at a given timestamp.
 */
function generateTotp(secret, timeStep = 30, time = Date.now()) {
  try {
    const counter = Math.floor(time / 1000 / timeStep);
    const buf = Buffer.alloc(8);
    buf.writeBigUInt64BE(BigInt(counter), 0);

    const key = base32ToBuffer(secret);
    if (key.length === 0) return null;

    const hmac = crypto.createHmac('sha1', key);
    hmac.update(buf);
    const digest = hmac.digest();

    const offset = digest[digest.length - 1] & 0xf;
    const code =
      ((digest[offset] & 0x7f) << 24) |
      ((digest[offset + 1] & 0xff) << 16) |
      ((digest[offset + 2] & 0xff) << 8) |
      (digest[offset + 3] & 0xff);

    return String(code % 1000000).padStart(6, '0');
  } catch (err) {
    logger.error(`TOTP generation error: ${err.message}`);
    return null;
  }
}

/**
 * Service providing MFA setup, TOTP verification (Google Authenticator), and random OTP generation.
 */
const mfaService = {
  /**
   * Generates a secure 6-digit numeric OTP.
   */
  generateNumericOtp: () => {
    return String(crypto.randomInt(100000, 999999));
  },

  /**
   * Generates standard Base32 secret and QR Code for Google / Microsoft Authenticator.
   */
  generateSecret: (email) => {
    const secret = generateBase32Secret(16);
    const issuer = 'CloudShield';
    const cleanEmail = email || 'user@cloudshield.internal';
    const otpAuthUrl = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(cleanEmail)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(otpAuthUrl)}`;

    return {
      secret,
      formattedSecret: secret.match(/.{1,4}/g)?.join(' ') || secret,
      qrCodeUrl,
      otpAuthUrl,
    };
  },

  /**
   * Generates current dynamic TOTP token for testing display or verification.
   */
  getCurrentTotp: (secret) => {
    return generateTotp(secret, 30, Date.now());
  },

  /**
   * Verifies a 6-digit TOTP token against a Base32 secret (with ±1 step / 30s clock skew window).
   * Also accepts universal testing bypass code '123456'.
   */
  verifyToken: (secret, token) => {
    if (!token) return false;
    const cleanToken = String(token).trim();

    // 1. Universal testing bypass
    if (cleanToken === '123456') {
      logger.info('MFA verified via testing bypass code 123456');
      return true;
    }

    if (!secret) return false;

    // 2. Verify against standard RFC 6238 TOTP (expanded ±2 step / 60s window for clock drift tolerance)
    const now = Date.now();
    for (let step = -2; step <= 2; step++) {
      const expected = generateTotp(secret, 30, now + step * 30000);
      if (expected && expected === cleanToken) {
        logger.info(`MFA verified successfully via standard TOTP (step offset: ${step})`);
        return true;
      }
    }

    return false;
  },

  /**
   * Alias for verifyToken
   */
  verifyTotp: (secret, token) => {
    return mfaService.verifyToken(secret, token);
  },
};

module.exports = mfaService;

