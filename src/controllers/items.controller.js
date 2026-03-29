const itemsService = require('../services/items.service');

async function list(req, res) {
  const q = req.query.q ? String(req.query.q) : '';
  const items = await itemsService.searchItems({ q });
  res.json(items);
}

async function detail(req, res) {
  const itemId = Number(req.params.id);
  const item = await itemsService.getItemById(itemId);
  if (!item) {
    return res.status(404).json({
      error: 'ITEM_NOT_FOUND',
      message: 'Item not found'
    });
  }
  return res.json(item);
}

async function unlock(req, res) {
  const itemId = Number(req.params.id);
  const result = await itemsService.unlockContact({ userId: req.user.id, itemId });

  if (!result.ok) {
    return res.status(result.status).json({
      error: result.error,
      message: result.message
    });
  }

  return res.json({
    unlocked: true,
    alreadyUnlocked: result.already,
    unlockType: result.unlockType,
    contact: result.contact
  });
}

async function create(req, res) {
  const images = Array.isArray(req.files) ? req.files : [];
  const imageUrls = images.map((f) => `/uploads/${f.filename}`);

  const result = await itemsService.createItem({
    userId: req.user.id,
    data: {
      title: req.body.title,
      description: req.body.description,
      price: req.body.price,
      category: req.body.category,
      location: req.body.location,
      use_default_location: req.body.use_default_location,
      latitude: req.body.latitude,
      longitude: req.body.longitude
    },
    imageUrls
  });

  if (!result.ok) {
    return res.status(result.status).json({
      error: result.error,
      message: result.message
    });
  }

  return res.status(201).json({
    id: result.itemId,
    status: 'ACTIVE',
    images: imageUrls
  });
}

async function update(req, res) {
  const itemId = Number(req.params.id);
  const result = await itemsService.updateItem({
    actorId: req.user.id,
    actorRole: req.user.role,
    itemId,
    data: req.body
  });

  if (!result.ok) {
    return res.status(result.status).json({
      error: result.error,
      message: result.message
    });
  }

  return res.json({
    id: result.itemId
  });
}

async function remove(req, res) {
  const itemId = Number(req.params.id);
  const result = await itemsService.deleteItem({
    actorId: req.user.id,
    actorRole: req.user.role,
    itemId
  });

  if (!result.ok) {
    return res.status(result.status).json({
      error: result.error,
      message: result.message
    });
  }

  return res.json({
    deleted: true,
    id: result.itemId
  });
}

module.exports = { list, detail, unlock, create, update, remove };
