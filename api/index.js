const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const dutyRoutes = require('./routes/duties');
const swapRoutes = require('./routes/swaps');
const calendarRoutes = require('./routes/calendar');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

app.use('/api/auth', authRoutes);
app.use('/api/duties', dutyRoutes);
app.use('/api/swaps', swapRoutes);
app.use('/api/calendar', calendarRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;