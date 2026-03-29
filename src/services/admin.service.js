const { pool } = require('../db');

const ALLOWED_ROLES = ['BUYER', 'SELLER', 'ADMIN'];

async function changeUserRole({ targetUserId, role }) {
  const nextRole = String(role || '').toUpperCase();
  if (!ALLOWED_ROLES.includes(nextRole)) {
    return {
      ok: false,
      status: 400,
      error: 'VALIDATION_ERROR',
      message: `role must be one of: ${ALLOWED_ROLES.join(', ')}`
    };
  }

  const [res] = await pool.execute(
    'UPDATE users SET role = ? WHERE id = ?',
    [nextRole, targetUserId]
  );

  if (res.affectedRows !== 1) {
    return { ok: false, status: 404, error: 'USER_NOT_FOUND', message: 'User not found' };
  }

  const [rows] = await pool.execute(
    'SELECT id, name, email, phone, role, credit, free_unlock, created_at FROM users WHERE id = ? LIMIT 1',
    [targetUserId]
  );

  return { ok: true, user: rows[0] };
}

module.exports = { changeUserRole };
