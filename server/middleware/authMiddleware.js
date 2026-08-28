/**
 * JWT Authentication Middleware
 */

const TokenHelper = require('../utils/tokenHelper');
const ResponseHandler = require('../utils/responseHandler');
const { HTTP_STATUS, ERROR_MESSAGES } = require('../config/constants');
const User = require('../models/User');

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
    const { valid, decoded, error } = TokenHelper.verifyAccessToken(token);

    if (!valid) {
      const message = error === 'TokenExpiredError'
        ? ERROR_MESSAGES.TOKEN_EXPIRED
        : ERROR_MESSAGES.INVALID_TOKEN;

      return ResponseHandler.error(res, message, HTTP_STATUS.UNAUTHORIZED);
    }

    // Verify that the user still exists
    const user = await User.findById(decoded.id);
    if (!user) {
      return ResponseHandler.error(
        res,
        'User account associated with this token no longer exists.',
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    // Attach user to request object (excluding password)
    req.user = User.toSafeObject(user);
    next();
  } catch (err) {
    return ResponseHandler.error(
      res,
      ERROR_MESSAGES.INTERNAL_ERROR,
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
};

module.exports = { authenticate };
