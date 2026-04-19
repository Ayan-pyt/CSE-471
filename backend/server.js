const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Load routes
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const internshipRoutes = require('./routes/internshipRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const cvRoutes = require('./routes/cvRoutes');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/internship', internshipRoutes);
app.use('/api/application', applicationRoutes);
app.use('/api/cv', cvRoutes);

// Health check
app.get('/', (req, res) => res.send('IntelliMatch API Running ✅'));

// Error handler (multer etc.)
app.use((err, req, res, next) => {
  res.status(400).json({ message: err.message || 'Something went wrong' });
});

// Start server
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });
