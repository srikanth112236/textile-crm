import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ecom';

// Track connection state
let isConnected = false;
let connectionAttempted = false;

// Helper function to validate and fix MongoDB URI
const validateMongoDBURI = (uri: string): string => {
  // Check if it's a MongoDB Atlas connection string (mongodb+srv://)
  if (uri.startsWith('mongodb+srv://')) {
    // Extract parts to check for common issues
    const match = uri.match(/^mongodb\+srv:\/\/([^:]+):([^@]+)@(.+)$/);
    if (!match) {
      console.warn('⚠️  MongoDB Atlas URI format may be incorrect');
      console.warn('   Format should be: mongodb+srv://username:password@host/database?options');
      console.warn('   If password contains special characters (@, :, /, etc.), they must be URL-encoded');
      console.warn('   Example: @ becomes %40, : becomes %3A');
    }
  }
  return uri;
};

export const connectDatabase = async (): Promise<void> => {
  if (connectionAttempted && isConnected) {
    console.log('✅ MongoDB already connected');
    return;
  }

  connectionAttempted = true;

  // Disable buffering globally - this prevents Mongoose from buffering commands
  // when not connected, which causes timeout errors
  mongoose.set('bufferCommands', false);

  try {
    const validatedURI = validateMongoDBURI(MONGODB_URI);
    const maskedURI = validatedURI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:***@');
    console.log(`🔌 Attempting to connect to MongoDB: ${maskedURI}`);
    
    await mongoose.connect(validatedURI, {
      serverSelectionTimeoutMS: 10000, // 10 seconds for Atlas
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
    });
    
    isConnected = true;
    console.log('✅ MongoDB connected successfully');
    console.log(`   Database: ${mongoose.connection.db?.databaseName || 'default'}`);
  } catch (error: any) {
    isConnected = false;
    console.error('❌ MongoDB connection error:', error.message);
    
    // Provide specific help based on error type
    if (error.message.includes('ENOTFOUND') || error.message.includes('querySrv')) {
      console.error('⚠️  DNS/Network error - Possible issues:');
      console.error('   1. Password contains special characters (@, :, /) - must be URL-encoded');
      console.error('      Example: Steyzi@2002 should be Steyzi%402002');
      console.error('   2. Incorrect hostname or cluster name');
      console.error('   3. Network connectivity issues');
      console.error('   4. IP address not whitelisted in MongoDB Atlas');
      console.error('   5. MongoDB Atlas cluster might be paused (check Atlas dashboard)');
    } else if (error.message.includes('authentication')) {
      console.error('⚠️  Authentication error - Check username and password');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.error('⚠️  Connection refused - Possible issues:');
      console.error('   1. MongoDB is not running locally');
      console.error('   2. If using Docker, run: docker compose up -d');
      console.error('   3. Check if MongoDB is listening on the correct port');
    } else {
      console.error('⚠️  Connection error - Check:');
      console.error('   - MongoDB is running (local) or accessible (Atlas)');
      console.error('   - Connection string format is correct');
      console.error('   - Network/firewall allows connection');
    }
    
    console.error(`   Current MONGODB_URI: ${MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:***@')}`);
    console.error('   Check your .env file in server/ directory');
    
    // In production, exit if connection fails
    if (process.env.NODE_ENV === 'production') {
      console.error('❌ Cannot start server without MongoDB connection in production');
      process.exit(1);
    } else {
      console.warn('⚠️  Continuing without MongoDB connection (development mode)');
      console.warn('   Database queries will fail immediately instead of timing out');
      console.warn('   To connect MongoDB:');
      console.warn('   - For local: docker compose up -d');
      console.warn('   - For Atlas: Check connection string and network access');
    }
  }
};

// Helper function to check if MongoDB is connected
export const isMongoDBConnected = (): boolean => {
  return isConnected && mongoose.connection.readyState === 1;
};

// Handle connection events
mongoose.connection.on('disconnected', () => {
  isConnected = false;
  console.log('⚠️  MongoDB disconnected');
});

mongoose.connection.on('error', (error) => {
  isConnected = false;
  console.error('❌ MongoDB error:', error.message);
});

mongoose.connection.on('connected', () => {
  isConnected = true;
  console.log('✅ MongoDB connection restored');
});

export default mongoose;

