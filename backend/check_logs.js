const mongoose = require('mongoose');
const ActivityLog = require('./models/ActivityLog');
require('dotenv').config();

async function checkLogs() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const logs = await ActivityLog.find({ action: 'USER_LOGGED_IN' }).sort({ createdAt: -1 }).limit(5);
    console.log('Recent login logs:');
    console.log(JSON.stringify(logs, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkLogs();
