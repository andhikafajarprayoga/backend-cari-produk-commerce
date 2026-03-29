const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const { pool } = require('../db');

async function register({ name, email, password, phone }) {
  const passwordHash = await bcrypt.hash(password, 10);
  const defaultFreeUnlock = Number(process.env.DEFAULT_FREE_UNLOCK || 3);

  const [result] = await pool.execute(
    'INSERT INTO users (name, email, password, phone, credit, free_unlock) VALUES (?, ?, ?, ?, 0, ?)',
    [name, email, passwordHash, phone || null, defaultFreeUnlock]
  );

  return { id: result.insertId };
}

async function login({ email, password }) {
  const [rows] = await pool.execute(
    'SELECT id, password FROM users WHERE email = ? LIMIT 1',
    [email]
  );

  const user = rows[0];
  if (!user) return null;

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return null;

  const token = jwt.sign(
    { sub: user.id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  return { token };
}

async function getMe(userId) {
  const [rows] = await pool.execute(
    'SELECT id, name, email, phone, address, latitude, longitude, role, credit, free_unlock, created_at FROM users WHERE id = ? LIMIT 1',
    [userId]
  );
  return rows[0] || null;
}

function parseNumber(value) {
  if (value === null || value === undefined) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function isValidLatitude(lat) {
  return typeof lat === 'number' && Number.isFinite(lat) && lat >= -90 && lat <= 90;
}

function isValidLongitude(lng) {
  return typeof lng === 'number' && Number.isFinite(lng) && lng >= -180 && lng <= 180;
}

async function becomeSeller(userId, { address, latitude, longitude } = {}) {
  const [rows] = await pool.execute(
    'SELECT id, role FROM users WHERE id = ? LIMIT 1',
    [userId]
  );

  const user = rows[0];
  if (!user) {
    return { ok: false, status: 401, error: 'UNAUTHORIZED', message: 'User not found' };
  }

  if (user.role === 'ADMIN') {
    return { ok: true, changed: false, role: 'ADMIN' };
  }

  if (user.role === 'SELLER') {
    return { ok: true, changed: false, role: 'SELLER' };
  }

  const cleanAddress = String(address || '').trim();
  const lat = parseNumber(latitude);
  const lng = parseNumber(longitude);

  if (!cleanAddress || !isValidLatitude(lat) || !isValidLongitude(lng)) {
    return {
      ok: false,
      status: 400,
      error: 'VALIDATION_ERROR',
      message: 'address, latitude (-90..90), longitude (-180..180) are required'
    };
  }

  const [res] = await pool.execute(
    "UPDATE users SET role = 'SELLER', address = ?, latitude = ?, longitude = ? WHERE id = ? AND role = 'BUYER'",
    [cleanAddress, lat, lng, userId]
  );

  if (res.affectedRows !== 1) {
    // Role changed concurrently or invalid state
    const [fresh] = await pool.execute('SELECT role FROM users WHERE id = ? LIMIT 1', [userId]);
    return { ok: true, changed: false, role: (fresh[0] && fresh[0].role) || 'BUYER' };
  }

  return { ok: true, changed: true, role: 'SELLER' };
}

module.exports = { register, login, getMe, becomeSeller };
