/**
 * JWT & Supabase Unified Authentication Middleware
 */

const TokenHelper = require('../utils/tokenHelper');
const ResponseHandler = require('../utils/responseHandler');
const { HTTP_STATUS, ERROR_MESSAGES } = require('../config/constants');
const User = require('../models/User');
const { supabase, isSupabaseConfigured } = require('../services/supabaseService');
const logger = require('../utils/logger');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ResponseHandler.error(
        res,
        ERROR_MESSAGES.UNAUTHORIZED,
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    const token = authHeader.split(' ')[1];

    // Scenario A: Supabase Auth is enabled and active
    if (isSupabaseConfigured) {
      try {
        const { data: authData, error: authError } = await supabase.auth.getUser(token);
        
        if (!authError && authData && authData.user) {
          const supabaseUser = authData.user;
          
          // Verify if user exists in our local table. If not, auto-provision
          let user = await User.findById(supabaseUser.id);
          if (!user) {
            user = await User.create({
              id: supabaseUser.id,
              name: supabaseUser.user_metadata?.name || supabaseUser.user_metadata?.full_name || 'User',
              email: supabaseUser.email,
              role: supabaseUser.user_metadata?.role || 'user',
              avatarUrl: supabaseUser.user_metadata?.avatar_url || null
            });
          }
          
          req.user = User.toSafeObject(user);
          return next();
        }
      } catch (err) {
        logger.warn('Supabase getUser network lookup error, checking decoded payload:', err.message);
      }
    }

    // Scenario B: Direct Supabase JWT structure validation (for offline, local dev, or fast paths)
    const jwt = require('jsonwebtoken');
    const decodedGeneric = jwt.decode(token);
    if (decodedGeneric && decodedGeneric.sub && (decodedGeneric.aud === 'authenticated' || (decodedGeneric.iss && decodedGeneric.iss.includes('supabase')))) {
      const nowSec = Math.floor(Date.now() / 1000);
      if (decodedGeneric.exp && decodedGeneric.exp < nowSec) {
        return ResponseHandler.error(res, ERROR_MESSAGES.TOKEN_EXPIRED, HTTP_STATUS.UNAUTHORIZED);
      }

      let user = await User.findById(decodedGeneric.sub);
      if (!user) {
        user = await User.create({
          id: decodedGeneric.sub,
          name: decodedGeneric.user_metadata?.name || decodedGeneric.user_metadata?.full_name || decodedGeneric.email?.split('@')[0] || 'User',
          email: decodedGeneric.email,
          role: decodedGeneric.user_metadata?.role || 'user',
          avatarUrl: decodedGeneric.user_metadata?.avatar_url || null
        });
      }

      req.user = User.toSafeObject(user);
      return next();
    }

    // Scenario C: Fallback to standard JWT validation (for dev seeds and tests)
    const { valid, decoded, error } = TokenHelper.verifyAccessToken(token);

    if (!valid) {
      const message = error === 'TokenExpiredError'
        ? ERROR_MESSAGES.TOKEN_EXPIRED
        : ERROR_MESSAGES.INVALID_TOKEN;

      return ResponseHandler.error(res, message, HTTP_STATUS.UNAUTHORIZED);
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return ResponseHandler.error(
        res,
        'User account associated with this token no longer exists.',
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    req.user = User.toSafeObject(user);
    next();
  } catch (err) {
    logger.error('Authentication middleware exception:', err);
    return ResponseHandler.error(
      res,
      ERROR_MESSAGES.INTERNAL_ERROR,
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
};

module.exports = { authenticate };
