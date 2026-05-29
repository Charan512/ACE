import mongoose from 'mongoose';

/**
 * Establishes a connection to MongoDB using the MONGO_URI from environment variables.
 * Called once at server startup — Mongoose handles connection pooling internally.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // Mongoose 8+ has these on by default, but being explicit is good practice
      serverSelectionTimeoutMS: 5000, // Fail fast if cluster is unreachable
    });

    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB connection failed: ${error.message}`);
    // A DB failure is unrecoverable — exit cleanly so a process manager restarts the server
    process.exit(1);
  }
};

// Emit warnings on connection drops (post-initial connect)
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected. Attempting to reconnect...');
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected.');
});

export default connectDB;
