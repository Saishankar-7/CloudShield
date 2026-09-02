const logger = require('../utils/logger');

/**
 * Service to simulate MFA setup and verification.
 */
const mfaService = {
  /**
   * Generates a secure 6-digit numeric OTP.
   */
  generateNumericOtp: () => {
    const crypto = require('crypto');
    return String(crypto.randomInt(100000, 999999));
  },

  /**
   * Generates a mock secret and returns setup details.
   */
  generateSecret: (email) => {
    const secret = Math.random().toString(36).substring(2, 12).toUpperCase();
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=otpauth://totp/CloudShield:${email}?secret=${secret}&issuer=CloudShield`;
    
    return {
      secret,
      qrCodeUrl,
    };
  },

  /**
   * Verifies the 6-digit OTP.
   * For the mock, we accept:
   * - "123456" as a universal testing bypass code
   * - The current minute-based code for a given secret
   */
  verifyToken: (secret, token) => {
    logger.info(`Verifying MFA token: ${token} against secret: ${secret}`);
    
    if (token === '123456') {
      return true;
    }
    
    // Simple reproducible code based on secret and current 30-sec window
    const timeIndex = Math.floor(Date.now() / 30000);
    const calculatedCode = String(Math.abs(hashString(secret + timeIndex)) % 1000000).padStart(6, '0');
    
    logger.info(`Generated expected token for testing: ${calculatedCode}`);
    
    return token === calculatedCode;
  }
};

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}

module.exports = mfaService;
