const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const bookingRoutes = require('./routes/bookings');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Avoid buffering database queries when MongoDB is unavailable.
app.use('/api', (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ message: 'Database unavailable. Check the server database configuration.' });
  }
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/bookings', bookingRoutes);

// Database Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/eventora')
  .then(() => console.log('MongoDB Connected'))
  .catch(err => {
    const codes = new Set();
    const collectCodes = (error, depth = 0) => {
      if (!error || depth > 4) return;
      if (typeof error.code === 'string' && /^[A-Z_]+$/.test(error.code)) codes.add(error.code);
      collectCodes(error.cause, depth + 1);
      if (error.reason?.servers) {
        for (const server of error.reason.servers.values()) collectCodes(server.error, depth + 1);
      }
    };
    collectCodes(err);
    console.error('MongoDB connection failed:', err.name, codes.size ? `(${[...codes].join(', ')})` : '');
    console.error('Check MONGO_URI, database user credentials, Atlas Network Access, and DNS connectivity.');
  });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
