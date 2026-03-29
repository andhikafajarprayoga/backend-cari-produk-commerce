const jwt = require('jsonwebtoken');

const { pool } = require('../db');

async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Missing or invalid Authorization header'
    });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const userId = payload.sub;
    const [rows] = await pool.execute(
      'SELECT id, role FROM users WHERE id = ? LIMIT 1',
      [userId]
    );

    const user = rows[0];
    if (!user) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'User not found'
      });
    }

    req.user = { id: user.id, role: user.role };
    return next();
  } catch (err) {
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Invalid token'
    });
  }
}

function requireRole(allowedRoles) {
  const allowed = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Missing auth context'
      });
    }

    if (!allowed.includes(req.user.role)) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: 'Insufficient role'
      });
    }

    return next();
  };
}

module.exports = { requireAuth, requireRole };
