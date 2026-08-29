/**
 * Standardized API Response Utilities
 */

const { HTTP_STATUS } = require('../config/constants');

class ResponseHandler {
  /**
   * Send a successful JSON response
   */
  static success(res, message = 'Success', data = null, statusCode = HTTP_STATUS.OK, meta = null) {
    const payload = {
      success: true,
      statusCode,
      message,
      data
    };
    if (meta) {
      payload.meta = meta;
    }
    return res.status(statusCode).json(payload);
  }

  /**
   * Send a resource created response
   */
  static created(res, message = 'Resource created successfully', data = null) {
    return this.success(res, message, data, HTTP_STATUS.CREATED);
  }

  /**
   * Send an error response
   */
  static error(res, message = 'An error occurred', statusCode = HTTP_STATUS.BAD_REQUEST, errors = null) {
    const payload = {
      success: false,
      statusCode,
      message
    };
    if (errors) {
      payload.errors = errors;
    }
    return res.status(statusCode).json(payload);
  }

  /**
   * Send a paginated collection response
   */
  static paginated(res, message = 'Data retrieved successfully', items = [], page = 1, limit = 10, total = 0) {
    const totalPages = Math.ceil(total / limit) || 1;
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      statusCode: HTTP_STATUS.OK,
      message,
      data: items,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalItems: total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  }
}

module.exports = ResponseHandler;
