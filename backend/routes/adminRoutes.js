/**
 * Admin Management Routes (Role-Based Authorization)
 */

const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/adminController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { validate } = require('../middleware/validateMiddleware');
const { ROLES } = require('../config/constants');

// Validation Schemas
const updateRoleSchema = {
  role: { required: true, enum: Object.values(ROLES) }
};

// All admin routes require Authentication AND Admin Role
router.use(authenticate);
router.use(authorize(ROLES.ADMIN));

router.get('/users', AdminController.getUsers);
router.get('/analytics', AdminController.getAnalytics);
router.patch('/users/:id/role', validate(updateRoleSchema), AdminController.updateUserRole);
router.delete('/users/:id', AdminController.deleteUser);

module.exports = router;
