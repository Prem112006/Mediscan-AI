const mongoose = require('mongoose');
const dns = require('dns');

// Disable query buffering globally to prevent hanging on disconnected states
mongoose.set('bufferCommands', false);

// Use Google Public DNS to resolve MongoDB Atlas SRV records
// (fixes ECONNREFUSED on networks that block SRV lookups)
dns.setServers(['8.8.8.8', '8.8.4.4']);

const connectDB = async () => {
  try {
    const connString = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mediscan';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(connString, {
      serverSelectionTimeoutMS: 3000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
    });
    console.log('MongoDB Connected successfully to database:', mongoose.connection.db.databaseName);
  } catch (error) {
    console.error('Unable to connect to the MongoDB database:', error);
    // Do not crash immediately in dev environment if Mongo isn't running yet
    // so they can see the error clearly in logs.
  }
};

module.exports = { connectDB };
