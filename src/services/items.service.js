const { pool, withTransaction } = require('../db');

async function searchItems({ q }) {
  const search = q ? `%${q}%` : null;

  if (!search) {
    const [rows] = await pool.execute(
      "SELECT id, user_id, title, description, price, category, location, latitude, longitude, status, is_premium, premium_expired_at, created_at FROM items WHERE status = 'ACTIVE' ORDER BY created_at DESC LIMIT 50"
    );
    return rows;
  }

  const [rows] = await pool.execute(
    "SELECT id, user_id, title, description, price, category, location, latitude, longitude, status, is_premium, premium_expired_at, created_at FROM items WHERE status = 'ACTIVE' AND (title LIKE ? OR description LIKE ?) ORDER BY created_at DESC LIMIT 50",
    [search, search]
  );

  return rows;
}

async function getItemById(itemId) {
  const [rows] = await pool.execute(
    'SELECT id, user_id, title, description, price, category, location, latitude, longitude, status, is_premium, premium_expired_at, created_at FROM items WHERE id = ? LIMIT 1',
    [itemId]
  );
  return rows[0] || null;
}

async function getItemContact(itemId) {
  const [rows] = await pool.execute(
    'SELECT contact_phone, contact_whatsapp FROM items WHERE id = ? LIMIT 1',
    [itemId]
  );
  return rows[0] || null;
}

async function getItemContactWithConn(conn, itemId) {
  const [rows] = await conn.execute(
    `SELECT u.phone AS contact_phone, u.phone AS contact_whatsapp
     FROM items i
     JOIN users u ON u.id = i.user_id
     WHERE i.id = ?
     LIMIT 1`,
    [itemId]
  );
  return rows[0] || null;
}

async function unlockContact({ userId, itemId }) {
  const numericItemId = Number(itemId);

  return withTransaction(async (conn) => {
    // Lock user row first to prevent double debit on concurrent requests.
    const [userRows] = await conn.execute(
      'SELECT id, credit, free_unlock FROM users WHERE id = ? FOR UPDATE',
      [userId]
    );

    const user = userRows[0];
    if (!user) {
      return { ok: false, status: 401, error: 'UNAUTHORIZED', message: 'User not found' };
    }

    const [unlockRows] = await conn.execute(
      'SELECT id, unlock_type FROM contact_unlocks WHERE user_id = ? AND item_id = ? LIMIT 1',
      [userId, numericItemId]
    );

    if (unlockRows[0]) {
      const contact = await getItemContactWithConn(conn, numericItemId);
      return { ok: true, already: true, unlockType: unlockRows[0].unlock_type, contact };
    }

    // Ensure item exists
    const [itemRows] = await conn.execute(
      'SELECT id FROM items WHERE id = ? LIMIT 1',
      [numericItemId]
    );

    if (!itemRows[0]) {
      return { ok: false, status: 404, error: 'ITEM_NOT_FOUND', message: 'Item not found' };
    }

    let unlockType = null;

    if (user.free_unlock > 0) {
      const [res] = await conn.execute(
        'UPDATE users SET free_unlock = free_unlock - 1 WHERE id = ? AND free_unlock > 0',
        [userId]
      );
      if (res.affectedRows === 1) {
        unlockType = 'FREE';
        await conn.execute(
          'INSERT INTO credit_transactions (user_id, type, amount, description) VALUES (?, \'FREE_USE\', 1, ?)',
          [userId, `Unlock contact for item ${numericItemId} (free)`]
        );
      }
    }

    if (!unlockType && user.credit > 0) {
      const [res] = await conn.execute(
        'UPDATE users SET credit = credit - 1 WHERE id = ? AND credit > 0',
        [userId]
      );
      if (res.affectedRows === 1) {
        unlockType = 'CREDIT';
        await conn.execute(
          'INSERT INTO credit_transactions (user_id, type, amount, description) VALUES (?, \'CREDIT_USE\', 1, ?)',
          [userId, `Unlock contact for item ${numericItemId}`]
        );
      }
    }

    if (!unlockType) {
      return { ok: false, status: 400, error: 'CREDIT_HABIS', message: 'Free unlock dan credit habis' };
    }

    await conn.execute(
      'INSERT INTO contact_unlocks (user_id, item_id, unlock_type) VALUES (?, ?, ?)',
      [userId, numericItemId, unlockType]
    );

    const contact = await getItemContactWithConn(conn, numericItemId);
    return { ok: true, already: false, unlockType, contact };
  });
}

module.exports = {
  searchItems,
  getItemById,
  createItem,
  unlockContact
};

async function createItem({ userId, data, imageUrls }) {
  const images = Array.isArray(imageUrls) ? imageUrls.filter(Boolean) : [];
  if (images.length > 8) {
    return { ok: false, status: 400, error: 'MAX_IMAGES_EXCEEDED', message: 'Maksimal 8 foto' };
  }

  const title = (data.title || '').trim();
  if (!title) {
    return { ok: false, status: 400, error: 'VALIDATION_ERROR', message: 'title is required' };
  }

  const useDefaultLocationRaw = data.use_default_location;
  const useDefaultLocation =
    useDefaultLocationRaw === true ||
    String(useDefaultLocationRaw || '').toLowerCase() === 'true' ||
    String(useDefaultLocationRaw || '') === '1';

  const lat = data.latitude != null && data.latitude !== '' ? Number(data.latitude) : null;
  const lng = data.longitude != null && data.longitude !== '' ? Number(data.longitude) : null;

  const isValidLat = (v) => typeof v === 'number' && Number.isFinite(v) && v >= -90 && v <= 90;
  const isValidLng = (v) => typeof v === 'number' && Number.isFinite(v) && v >= -180 && v <= 180;

  return withTransaction(async (conn) => {
    let finalLocation = data.location || null;
    let finalLat = lat;
    let finalLng = lng;

    if (useDefaultLocation) {
      const [userRows] = await conn.execute(
        'SELECT address, latitude, longitude FROM users WHERE id = ? LIMIT 1',
        [userId]
      );

      const u = userRows[0];
      if (!u || !u.address || u.latitude == null || u.longitude == null) {
        return { ok: false, status: 400, error: 'DEFAULT_LOCATION_MISSING', message: 'User default location is not set' };
      }

      finalLocation = u.address;
      finalLat = Number(u.latitude);
      finalLng = Number(u.longitude);
    } else {
      if (!isValidLat(finalLat) || !isValidLng(finalLng)) {
        return { ok: false, status: 400, error: 'VALIDATION_ERROR', message: 'latitude (-90..90) and longitude (-180..180) are required' };
      }
    }

    const [result] = await conn.execute(
      'INSERT INTO items (user_id, title, description, price, category, location, latitude, longitude, contact_phone, contact_whatsapp, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, \'ACTIVE\')',
      [
        userId,
        title,
        data.description || null,
        data.price != null && data.price !== '' ? Number(data.price) : null,
        data.category || null,
        finalLocation,
        finalLat,
        finalLng
      ]
    );

    const itemId = result.insertId;

    for (const url of images) {
      await conn.execute(
        'INSERT INTO item_images (item_id, image_url) VALUES (?, ?)',
        [itemId, url]
      );
    }

    return { ok: true, itemId };
  });
}
