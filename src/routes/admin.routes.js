const express = require('express');

const { requireAuth, requireRole } = require('../middleware/auth');
const adminController = require('../controllers/admin.controller');

const router = express.Router();

// Admin-only: change a user's role
router.patch('/users/:id/role', requireAuth, requireRole(['ADMIN']), adminController.changeRole);

module.exports = router;
