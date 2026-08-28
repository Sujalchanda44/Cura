/**
 * JWT Token Generation and Verification Helper
 */

const jwt = require('jsonwebtoken');
const config = require('../config/env');

class TokenHelper {
  /**
   * Generate an Access Token
   */
  static generateAccessToken(payload) {
    return jwt.sign(payload, config.jwt.accessSecret, {
      expiresIn: config.jwt.accessExpiration
    });
  }

  /**
   * Generate a Refresh Token
   */
  static generateRefreshToken(payload) {
    return jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiration
    });
  }

  /**
   * Verify an Access Token
   */
  static verifyAccessToken(token) {
    try {
      return { valid: true, decoded: jwt.verify(token, config.jwt.accessSecret) };
    } catch (error) {
      return { valid: false, error: error.name, message: error.message };
    }
  }

  /**
   * Verify a Refresh Token
   */
  static verifyRefreshToken(token) {
    try {
      return { valid: true, decoded: jwt.verify(token, config.jwt.refreshSecret) };
    } catch (error) {
      return { valid: false, error: error.name, message: error.message };
    }
  }
}

module.exports = TokenHelper;
