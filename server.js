const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const scraperRoutes = require('./routes/scraper.routes');

const app = express();
const PORT = process.env.PORT || 5000;

const corsOptions = {
  origin: 'https://chainsaw-price-hunter-production.up.railway.app',
  credentials: true
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
