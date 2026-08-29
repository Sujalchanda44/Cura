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
        logger.error('Supabase JWT verification error, falling back to standard verification:', err);
      }
    }

    // Scenario B: Fallback to standard JWT validation (for dev seeds and tests)
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
