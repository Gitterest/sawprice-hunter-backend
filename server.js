const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();
const scraperRoutes = require('./routes/scraper.routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Allow overriding the frontend URL via env variable for local development
const corsOptions = {
  origin: process.env.CLIENT_URL ||
    'https://chainsaw-price-hunter-production.up.railway.app',
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/scraper', scraperRoutes);

// Health check
app.get('/', (req, res) => {
  res.send('🪓 Sawprice Hunter API is running!');
});

// 404 fallback
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
});
