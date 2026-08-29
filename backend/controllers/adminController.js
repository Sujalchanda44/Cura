/**
 * Admin Controller (Role-Based Authorization Protected)
 * Provides User Management and Platform-wide Analytics
 */

const User = require('../models/User');
const memoryDb = require('../database/memoryStore');
const ResponseHandler = require('../utils/responseHandler');
const { HTTP_STATUS, ROLES } = require('../config/constants');

class AdminController {
  /**
   * Get Users List with Pagination
   * GET /api/admin/users
   */
  static async getUsers(req, res, next) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;
      const search = req.query.search || '';

      const { users, total } = await User.getAll(page, limit, search);

      return ResponseHandler.paginated(res, 'Users fetched successfully', users, page, limit, total);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get Platform Analytics
   * GET /api/admin/analytics
   */
  static async getAnalytics(req, res, next) {
    try {
      const [totalUsers, totalProfiles, totalNutritionLogs, totalMetrics, totalReminders] = await Promise.all([
        memoryDb.count('users'),
        memoryDb.count('healthProfiles'),
        memoryDb.count('nutritionLogs'),
        memoryDb.count('healthMetrics'),
        memoryDb.count('notifications')
      ]);

      const allUsers = await memoryDb.find('users');
      const adminCount = allUsers.filter(u => u.role === ROLES.ADMIN).length;
      const standardCount = allUsers.filter(u => u.role === ROLES.USER).length;

      return ResponseHandler.success(res, 'Admin analytics retrieved successfully', {
        overview: {
          totalRegisteredUsers: totalUsers,
          activeHealthProfiles: totalProfiles,
          totalMealsLogged: totalNutritionLogs,
          totalDailyMetricEntries: totalMetrics,
          totalActiveReminders: totalReminders
        },
        userDistribution: {
          administrators: adminCount,
          regularUsers: standardCount
        },
        systemHealth: {
          status: 'Healthy',
          uptimeSeconds: process.uptime(),
          nodeVersion: process.version,
          memoryUsage: process.memoryUsage()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update User Role
   * PATCH /api/admin/users/:id/role
   */
  static async updateUserRole(req, res, next) {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!Object.values(ROLES).includes(role)) {
        return ResponseHandler.error(
          res,
          `Invalid role. Must be one of: [${Object.values(ROLES).join(', ')}]`,
          HTTP_STATUS.BAD_REQUEST
        );
      }

      const user = await User.findById(id);
      if (!user) {
        return ResponseHandler.error(res, 'User not found', HTTP_STATUS.NOT_FOUND);
      }

      // Prevent self-demotion from admin
      if (user.id === req.user.id && role !== ROLES.ADMIN) {
        return ResponseHandler.error(
          res,
          'You cannot remove admin privileges from your own account.',
          HTTP_STATUS.BAD_REQUEST
        );
      }

      const updated = await User.update(id, { role });

      return ResponseHandler.success(
        res,
        `User role updated to '${role}' successfully`,
        User.toSafeObject(updated)
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete User Account
   * DELETE /api/admin/users/:id
   */
  static async deleteUser(req, res, next) {
    try {
      const { id } = req.params;

      if (id === req.user.id) {
        return ResponseHandler.error(
          res,
          'You cannot delete your own admin account through this endpoint.',
          HTTP_STATUS.BAD_REQUEST
        );
      }

      const deleted = await User.delete(id);
      if (!deleted) {
        return ResponseHandler.error(res, 'User not found', HTTP_STATUS.NOT_FOUND);
      }

      return ResponseHandler.success(res, 'User and associated health data deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AdminController;
