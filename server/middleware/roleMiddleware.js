/**
 * Role-Based Authorization Middleware (RBAC)
 */

const ResponseHandler = require('../utils/responseHandler');
const { HTTP_STATUS, ERROR_MESSAGES } = require('../config/constants');

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return ResponseHandler.error(
        res,
        ERROR_MESSAGES.UNAUTHORIZED,
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    if (!allowedRoles.includes(req.user.role)) {
      return ResponseHandler.error(
        res,
        `Access denied. Requires one of roles: [${allowedRoles.join(', ')}]`,
        HTTP_STATUS.FORBIDDEN
      );
    }

    next();
  };
};

module.exports = { authorize };
