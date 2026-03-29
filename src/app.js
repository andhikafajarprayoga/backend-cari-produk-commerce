const express = require('express');
const cors = require('cors');
const path = require('path');

const { errorHandler, notFoundHandler } = require('./middleware/errors');
const authRoutes = require('./routes/auth.routes');
const itemRoutes = require('./routes/items.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.use('/auth', authRoutes);
app.use('/items', itemRoutes);
app.use('/admin', adminRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
