const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));
app.use(express.json());

// Serve uploaded files statically (local dev only)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Load routes
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const internshipRoutes = require('./routes/internshipRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const cvRoutes = require('./routes/cvRoutes');
const matchRoutes = require('./routes/matchRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const interviewRoutes = require('./routes/interviewRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const adminRoutes = require('./routes/adminRoutes');
const skillVerificationRoutes = require('./routes/skillVerificationRoutes');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/internship', internshipRoutes);
app.use('/api/application', applicationRoutes);
app.use('/api/cv', cvRoutes);
app.use('/api/match', matchRoutes);
app.use('/api/notification', notificationRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/skill-verification', skillVerificationRoutes);

// Health check
app.get('/', (req, res) => res.send('IntelliMatch API Running ✅'));

// Error handler
app.use((err, req, res, next) => {
  res.status(400).json({ message: err.message || 'Something went wrong' });
});

// ── MongoDB connection with caching (serverless-safe) ──
let isConnected = false;
const connectDB = async () => {
  if (isConnected) return;
  if (mongoose.connection.readyState >= 1) {
    isConnected = true;
    return;
  }
  await mongoose.connect(process.env.MONGO_URI);
  isConnected = true;
  console.log('✅ Connected to MongoDB');
};

// Ensure DB is connected before every request (works on Vercel cold starts)
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('MongoDB connection error:', err);
    res.status(500).json({ message: 'Database connection failed' });
  }
});

// ── Local dev: start HTTP server ──
if (process.env.VERCEL !== '1') {
  const PORT = process.env.PORT || 5000;
  connectDB()
    .then(() => {
      app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
    })
    .catch(err => console.error('Startup error:', err));
}

// ── Export for Vercel serverless ──
module.exports = app;
