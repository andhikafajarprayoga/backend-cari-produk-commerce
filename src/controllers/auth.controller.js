const authService = require('../services/auth.service');

async function register(req, res) {
  const { name, email, password, phone } = req.body || {};

  if (!name || !email || !password) {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: 'name, email, password are required'
    });
  }

  try {
    const result = await authService.register({ name, email, password, phone });
    return res.status(201).json({ id: result.id });
  } catch (err) {
    if (String(err && err.code) === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        error: 'EMAIL_ALREADY_USED',
        message: 'Email already registered'
      });
    }
    throw err;
  }
}

async function login(req, res) {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: 'email and password are required'
    });
  }

  const result = await authService.login({ email, password });
  if (!result) {
    return res.status(401).json({
      error: 'INVALID_CREDENTIALS',
      message: 'Email/password incorrect'
    });
  }

  return res.json(result);
}

async function me(req, res) {
  const me = await authService.getMe(req.user.id);
  return res.json(me);
}

async function becomeSeller(req, res) {
  const { address, latitude, longitude } = req.body || {};
  const result = await authService.becomeSeller(req.user.id, { address, latitude, longitude });

  if (!result.ok) {
    return res.status(result.status).json({
      error: result.error,
      message: result.message
    });
  }

  return res.json({
    role: result.role,
    changed: result.changed
  });
}

module.exports = { register, login, me, becomeSeller };
