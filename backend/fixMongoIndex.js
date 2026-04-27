require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    try {
      // Drop the entire ExternalJobPost collection to clear bad index
      await mongoose.connection.collection('externaljobposts').drop();
      console.log('✅ Dropped externaljobposts collection');
    } catch (err) {
      console.log('Collection may not exist or already dropped:', err.message);
    }
    process.exit(0);
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
