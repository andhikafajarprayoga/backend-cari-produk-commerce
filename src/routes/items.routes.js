const express = require('express');

const { requireAuth, requireRole } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const itemsController = require('../controllers/items.controller');

const router = express.Router();

router.get('/', itemsController.list);
router.get('/:id', itemsController.detail);
router.post('/', requireAuth, requireRole(['SELLER', 'ADMIN']), upload.array('images', 8), itemsController.create);
router.post('/:id/unlock', requireAuth, itemsController.unlock);

module.exports = router;
