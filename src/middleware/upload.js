const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const safeExt = ext && ext.length <= 10 ? ext : '';
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${safeExt}`);
  }
});

function fileFilter(req, file, cb) {
  if (file && typeof file.mimetype === 'string' && file.mimetype.startsWith('image/')) {
    return cb(null, true);
  }
  return cb(new Error('Only image uploads are allowed'));
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    files: 8,
    fileSize: 5 * 1024 * 1024
  }
});

module.exports = { upload };
