import mongoose from 'mongoose';
import { config } from './config';

const connectDB = async (): Promise<void> => {
  try {

    if (!config.mongo.uri) {
      throw new Error('MongoDB URI is not configured');
    }

    await mongoose.connect(config.mongo.uri);

    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

export default connectDB;

