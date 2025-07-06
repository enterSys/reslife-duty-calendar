const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const dutyRoutes = require('./routes/duties');
const swapRoutes = require('./routes/swaps');
const calendarRoutes = require('./routes/calendar');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/duties', dutyRoutes);
app.use('/api/swaps', swapRoutes);
app.use('/api/calendar', calendarRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Vercel serverless function handler
module.exports = (req, res) => {
  // Remove /api prefix from the URL for Express routing
  const originalUrl = req.url;
  req.url = req.url.replace(/^\/api/, '');
  
  return new Promise((resolve, reject) => {
    app(req, res, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};