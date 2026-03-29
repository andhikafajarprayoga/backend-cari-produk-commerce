const adminService = require('../services/admin.service');

async function changeRole(req, res) {
  const targetUserId = Number(req.params.id);
  if (!Number.isFinite(targetUserId) || targetUserId <= 0) {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: 'Invalid user id'
    });
  }

  const { role } = req.body || {};
  const result = await adminService.changeUserRole({ targetUserId, role });

  if (!result.ok) {
    return res.status(result.status).json({
      error: result.error,
      message: result.message
    });
  }

  return res.json({ user: result.user });
}

module.exports = { changeRole };
